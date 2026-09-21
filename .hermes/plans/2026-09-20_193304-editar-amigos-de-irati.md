# Plan: editar y ampliar «Amigos de Irati»

## Goal

Permitir que una persona autenticada pueda añadir nuevas familias, editar sus datos y renombrar los grupos existentes desde `/amigos`, manteniendo la lista actual —incluido «Darío, Alma y Luna»— y la lectura offline sin añadir una base de datos paralela.

## Current context / assumptions

- El repositorio está en `/home/rafa/dev/irati-app`, en la rama `main`, con estado limpio y sincronizado con `origin/main`.
- La lista actual vive en Supabase, tabla `public.friend_entries`, definida en `supabase/migrations/20260920170000_create_friend_entries.sql`.
- Cada fila representa una familia o relación y contiene:
  - `id`
  - `group_label` nullable
  - `adults_label`
  - `children_label`
  - `sort_order`
- La UI actual de lectura está en `src/modules/friends/ui/friends-view.tsx`; ya permite buscar y plegar grupos, pero no modificar datos.
- La página autenticada es `src/app/(app)/amigos/page.tsx` y la lectura cacheada usa `src/modules/friends/infrastructure/cached-friend-read-repository.ts` con la etiqueta `CACHE_TAGS.friends`.
- Las escrituras deben ejecutarse exclusivamente en Server Actions autenticadas, igual que en `src/app/(app)/sueno/actions.ts` y `src/app/(app)/viaje/actions.ts`. No se debe exponer Supabase directamente al navegador.
- Se asume que un «grupo» existe cuando tiene al menos una entrada. Crear el primer nombre/familia con un `group_label` nuevo crea implícitamente el grupo. No se implementa todavía un grupo vacío.
- «Añadir nombres» significa añadir o editar una entrada con `adults_label` y `children_label`; se conserva el modelo actual de etiquetas de texto para no convertir prematuramente cada adulto o niño en una entidad independiente.
- No se añade borrado ni reordenación en esta entrega: el usuario ha pedido editar y añadir. Una entrada creada se añade al final; una entrada existente se puede mover de grupo editando `group_label`.
- La edición requiere conexión. La PWA seguirá pudiendo consultar el snapshot offline, pero no se crea una cola offline para estas mutaciones.
- No se crea una migración SQL: la tabla existente ya tiene columnas `INSERT`/`UPDATE` suficientes. Cualquier cambio de esquema futuro deberá ser una migración separada.
- Nunca se debe modificar una migración histórica ni volver a ejecutar una actualización que sustituya `Darío, Alma y Luna` por otro valor.

## Architecture / proposed approach

Añadir validación y casos de uso en `src/modules/friends/domain` y `src/modules/friends/application`, ampliar el puerto y el adaptador Supabase para crear entradas, actualizar entradas y renombrar grupos. Añadir Server Actions en `src/app/(app)/amigos/actions.ts` que comprueben sesión, validen formularios, invaliden `CACHE_TAGS.friends` y redirijan con mensajes de éxito/error. Extender la vista con hojas inferiores reutilizables para crear/editar una entrada y renombrar un grupo; el estado offline seguirá siendo de solo lectura.

## Step-by-step tasks

### 1. Fijar el contrato de entrada editable con tests de dominio

Archivos:

- `src/modules/friends/domain/friend-entry.test.ts`
- `src/modules/friends/domain/friend-entry.ts`

TDD:

1. En `src/modules/friends/domain/friend-entry.test.ts`, añade este test completo:

```ts
import { describe, expect, it } from "vitest";
import {
  FriendEntryValidationError,
  normalizeFriendEntryInput,
} from "./friend-entry";

describe("normalizeFriendEntryInput", () => {
  it("recorta etiquetas y convierte un grupo vacío en null", () => {
    expect(
      normalizeFriendEntryInput({
        adultsLabel: "  Coral y David  ",
        childrenLabel: "  Darío, Alma y Luna  ",
        groupLabel: "   ",
      }),
    ).toEqual({
      adultsLabel: "Coral y David",
      childrenLabel: "Darío, Alma y Luna",
      groupLabel: null,
    });
  });

  it("rechaza adultos o niños vacíos", () => {
    expect(() =>
      normalizeFriendEntryInput({
        adultsLabel: " ",
        childrenLabel: "Leire",
        groupLabel: "Kamikazes",
      }),
    ).toThrow(FriendEntryValidationError);
  });
});
```

2. Ejecuta:

```bash
pnpm exec vitest run src/modules/friends/domain/friend-entry.test.ts
```

Resultado esperado antes de implementar: fallo de TypeScript/importación indicando que `FriendEntryValidationError` o `normalizeFriendEntryInput` no existe.

3. En `src/modules/friends/domain/friend-entry.ts`, añade exactamente este contrato y comportamiento, conservando las funciones actuales `groupFriendEntries` y `filterFriendGroups`:

```ts
export type FriendEntryInput = {
  groupLabel: string | null | undefined;
  adultsLabel: string;
  childrenLabel: string;
};

export class FriendEntryValidationError extends Error {
  constructor(public readonly messages: string[]) {
    super(messages.join(" "));
    this.name = "FriendEntryValidationError";
  }
}

export function normalizeFriendEntryInput(input: FriendEntryInput): {
  groupLabel: string | null;
  adultsLabel: string;
  childrenLabel: string;
} {
  const groupLabel = input.groupLabel?.trim() || null;
  const adultsLabel = input.adultsLabel.trim();
  const childrenLabel = input.childrenLabel.trim();
  const messages: string[] = [];

  if (!adultsLabel) messages.push("Indica los adultos.");
  if (!childrenLabel) messages.push("Indica los niños.");

  if (messages.length > 0) {
    throw new FriendEntryValidationError(messages);
  }

  return { adultsLabel, childrenLabel, groupLabel };
}
```

4. Ejecuta de nuevo el mismo comando. Resultado esperado: `2 tests passed`.
5. Ejecuta `git diff --check`; resultado esperado: sin salida y código `0`.
6. Haz un commit pequeño:

```bash
git add src/modules/friends/domain/friend-entry.ts src/modules/friends/domain/friend-entry.test.ts
git commit -m "feat(friends): validate editable entries"
```

Resultado esperado: commit creado con ese mensaje.

### 2. Añadir casos de uso de creación, actualización y renombrado de grupo

Archivos nuevos:

- `src/modules/friends/application/create-friend-entry.ts`
- `src/modules/friends/application/update-friend-entry.ts`
- `src/modules/friends/application/rename-friend-group.ts`

Archivos modificados:

- `src/modules/friends/application/friend-repository.ts`
- `src/modules/friends/application/create-friend-entry.test.ts`
- `src/modules/friends/application/update-friend-entry.test.ts`
- `src/modules/friends/application/rename-friend-group.test.ts`

TDD:

1. Amplía `FriendRepository` en `src/modules/friends/application/friend-repository.ts` con estos métodos, sin eliminar `listFriendEntries`:

```ts
import type { FriendEntry, FriendEntryInput } from "../domain/friend-entry";

export interface FriendRepository {
  listFriendEntries(): Promise<FriendEntry[]>;
  createFriendEntry(input: FriendEntryInput & { id: string; sortOrder: number }): Promise<FriendEntry>;
  updateFriendEntry(id: string, input: FriendEntryInput): Promise<FriendEntry>;
  renameFriendGroup(currentLabel: string, nextLabel: string): Promise<void>;
}
```

2. Crea `src/modules/friends/application/create-friend-entry.test.ts` con una implementación fake y este test:

```ts
import { describe, expect, it } from "vitest";
import { createFriendEntry } from "./create-friend-entry";
import type { FriendRepository } from "./friend-repository";

describe("createFriendEntry", () => {
  it("normaliza y delega una nueva entrada", async () => {
    const calls: unknown[] = [];
    const repository: FriendRepository = {
      listFriendEntries: async () => [],
      createFriendEntry: async (input) => {
        calls.push(input);
        return {
          ...input,
          groupLabel: input.groupLabel ?? null,
        };
      },
      updateFriendEntry: async () => {
        throw new Error("not used");
      },
      renameFriendGroup: async () => undefined,
    };

    await createFriendEntry(repository, {
      adultsLabel: " Coral y David ",
      childrenLabel: " Darío, Alma y Luna ",
      groupLabel: " Palomares ",
      id: "friend-1",
      sortOrder: 250,
    });

    expect(calls).toEqual([
      {
        adultsLabel: "Coral y David",
        childrenLabel: "Darío, Alma y Luna",
        groupLabel: "Palomares",
        id: "friend-1",
        sortOrder: 250,
      },
    ]);
  });
});
```

3. Ejecuta:

```bash
pnpm exec vitest run src/modules/friends/application/create-friend-entry.test.ts
```

Resultado esperado antes de implementar: fallo porque no existe `create-friend-entry.ts`.

4. Implementa `createFriendEntry` normalizando con `normalizeFriendEntryInput` y delegando en `repository.createFriendEntry`. Implementa de la misma forma `updateFriendEntry`; `renameFriendGroup` debe normalizar ambos nombres, rechazar etiquetas vacías o iguales y delegar en el repositorio.
5. Añade tests que cubran: actualización de `Darío` a `Darío, Alma y Luna`, rechazo de un grupo destino vacío y rechazo de renombrar `Palomares` a `Palomares`.
6. Ejecuta:

```bash
pnpm exec vitest run src/modules/friends/application
```

Resultado esperado: todos los tests de aplicación pasan.
7. Ejecuta `pnpm typecheck`; resultado esperado: `tsc --noEmit` termina con código `0`.
8. Haz commit:

```bash
git add src/modules/friends/application
 git commit -m "feat(friends): add friend mutation use cases"
```

### 3. Implementar las escrituras en el adaptador Supabase

Archivo:

- `src/modules/friends/infrastructure/supabase-friend-repository.ts`

Test nuevo:

- `src/modules/friends/infrastructure/supabase-friend-repository.test.ts`

TDD:

1. Crea un fake de `SupabaseClient<Database>` mínimo en el test y escribe tests que esperen estas operaciones:
   - `createFriendEntry` hace `insert` con `id`, `group_label`, `adults_label`, `children_label` y `sort_order`, y devuelve la fila creada.
   - `updateFriendEntry("palomares-coral-david", ...)` filtra por ese ID y actualiza `updated_at`.
   - `renameFriendGroup("Kamikazes", "Kamikazes antiguos")` filtra por `group_label` y actualiza todas las filas, sin cambiar `sort_order`.
2. Ejecuta:

```bash
pnpm exec vitest run src/modules/friends/infrastructure/supabase-friend-repository.test.ts
```

Resultado esperado antes de implementar: fallo porque el adaptador solo implementa `listFriendEntries`.
3. Implementa los tres métodos en `src/modules/friends/infrastructure/supabase-friend-repository.ts`. Usa la misma conversión de fila que ya existe en `listFriendEntries`; fija `updated_at: new Date().toISOString()` explícitamente y propaga cualquier `error` de Supabase.
4. No hagas `upsert` por defecto: `createFriendEntry` debe usar `insert` y `updateFriendEntry` debe filtrar por el ID exacto, para no sobrescribir accidentalmente a otra familia.
5. Ejecuta el test de nuevo y después:

```bash
pnpm typecheck
pnpm exec vitest run src/modules/friends/infrastructure
```

Resultado esperado: código `0` en ambos comandos.
6. Haz commit:

```bash
git add src/modules/friends/infrastructure/supabase-friend-repository.ts src/modules/friends/infrastructure/supabase-friend-repository.test.ts
git commit -m "feat(friends): persist friend edits in Supabase"
```

### 4. Crear Server Actions autenticadas e invalidación de caché

Archivos nuevos/modificados:

- `src/app/(app)/amigos/actions.ts`
- `src/app/(app)/amigos/actions.test.ts` si el entorno actual permite probar Server Actions sin arrancar Next
- `src/modules/friends/infrastructure/cached-friend-read-repository.ts`

TDD:

1. Antes de implementar, añade un test de la función pura de lectura del formulario, preferiblemente en `src/app/(app)/amigos/actions.test.ts`, que compruebe:
   - espacios recortados;
   - `groupLabel` vacío convertido en `null`;
   - adultos o niños vacíos producen error de validación;
   - el ID de actualización se lee literalmente, sin normalizarlo.
2. Ejecuta:

```bash
pnpm exec vitest run 'src/app/(app)/amigos/actions.test.ts'
```

Resultado esperado antes de implementar: fallo porque no existe el archivo de acciones o la función exportada.
3. Implementa `src/app/(app)/amigos/actions.ts` con:
   - directiva `"use server"`;
   - `requireSession()` basado en `hasValidSession()` y `redirect("/?error=session")`;
   - `createFriendEntryAction(formData)`;
   - `updateFriendEntryAction(formData)`;
   - `renameFriendGroupAction(formData)`;
   - lectura y validación a través de `normalizeFriendEntryInput` y los casos de uso;
   - `crypto.randomUUID()` para nuevas entradas;
   - para el orden nuevo, leer las entradas con el repositorio de escritura y usar `(max sort_order) + 10`, o `10` si no hay entradas;
   - redirecciones `/amigos?created=1`, `/amigos?updated=1`, `/amigos?groupUpdated=1` y códigos `validation`/`save` para errores;
   - tras cada escritura, llamar a:

```ts
function invalidateFriendReads() {
  updateTag(CACHE_TAGS.friends);
  revalidatePath("/amigos");
}
```

4. Mantén `cached-friend-read-repository.ts` con la clave `v3`; no cambies datos ni claves de la entrada de Coral y David. La invalidación por etiqueta es la solución normal y evita versionar la clave tras cada edición.
5. Ejecuta:

```bash
pnpm exec vitest run 'src/app/(app)/amigos/actions.test.ts'
pnpm typecheck
pnpm lint
```

Resultado esperado: tests, TypeScript y ESLint terminan con código `0`.
6. Haz commit:

```bash
git add 'src/app/(app)/amigos/actions.ts' 'src/app/(app)/amigos/actions.test.ts' src/modules/friends/infrastructure/cached-friend-read-repository.ts
git commit -m "feat(friends): add authenticated edit actions"
```

### 5. Crear la hoja inferior reutilizable para una entrada

Archivos nuevos:

- `src/modules/friends/ui/friend-entry-sheet.tsx`
- `src/modules/friends/ui/friend-entry-sheet.module.css` si los estilos no caben razonablemente en `friends-view.module.css`

Test nuevo:

- `src/modules/friends/ui/friend-entry-sheet.test.tsx`

TDD:

1. Escribe tests de React Testing Library que rendericen el componente con `mode="create"` y `mode="edit"` y comprueben:
   - título «Añadir amigo» en creación;
   - título «Editar amigo» en edición;
   - campos `groupLabel`, `adultsLabel` y `childrenLabel` con `required` en adultos y niños;
   - en edición aparece un `input` hidden `id` con el ID recibido;
   - los valores iniciales conservan exactamente tildes y puntuación, incluida `Darío, Alma y Luna`.
2. Ejecuta:

```bash
pnpm exec vitest run src/modules/friends/ui/friend-entry-sheet.test.tsx
```

Resultado esperado antes de implementar: fallo porque el componente no existe.
3. Implementa un componente cliente con esta API completa:

```ts
type FriendEntrySheetProps = {
  action: (formData: FormData) => void | Promise<void>;
  entry?: FriendEntry;
  groups: string[];
  initiallyOpen?: boolean;
  onClose?: () => void;
};
```

Usa `BottomSheet` y `PendingSubmitButton`, como `src/modules/weight/ui/weight-create-sheet.tsx`. En creación, el campo de grupo debe permitir escribir un nombre nuevo (`<input name="groupLabel" ...>`), no limitarse a un `<select>` de grupos existentes. En edición, precarga los tres campos y el ID.
4. Añade un botón flotante o de acción visible con `aria-label="Añadir amigo"`. El formulario debe mostrar «Necesitas conexión para guardar cambios» si el navegador está offline y debe evitar fingir que se guardó localmente; no añadas mutaciones a `PendingMutation` en esta entrega.
5. Ejecuta de nuevo el test y:

```bash
pnpm lint
pnpm typecheck
```

Resultado esperado: todo termina con código `0`.
6. Haz commit:

```bash
git add src/modules/friends/ui/friend-entry-sheet.tsx src/modules/friends/ui/friend-entry-sheet.test.tsx src/modules/friends/ui/friend-entry-sheet.module.css
 git commit -m "feat(friends): add friend entry editor"
```

Si no se crea el CSS separado, omite esa ruta del comando.

### 6. Añadir acciones de editar y renombrar grupo a la vista

Archivos:

- `src/modules/friends/ui/friends-view.tsx`
- `src/modules/friends/ui/friends-view.test.tsx`
- `src/modules/friends/ui/friend-group-sheet.tsx`
- `src/modules/friends/ui/friend-group-sheet.test.tsx`
- `src/modules/friends/ui/friends-view.module.css`

TDD:

1. En `friends-view.test.tsx`, añade tests que esperen:
   - un botón `Editar amigo` por cada entrada visible;
   - un botón `Editar grupo` por cada grupo con etiqueta distinta de `Sin grupo`;
   - al pulsar `Editar amigo`, se abre la hoja con los valores de esa entrada;
   - al pulsar `Editar grupo`, se abre un formulario con el nombre actual;
   - sigue funcionando la búsqueda y el texto `No encontramos coincidencias`.
2. Ejecuta:

```bash
pnpm exec vitest run src/modules/friends/ui/friends-view.test.tsx
```

Resultado esperado antes de implementar: fallos de aserción porque los botones y hojas aún no existen.
3. Amplía la API de `FriendsView` a:

```ts
type FriendsViewProps = {
  createAction: (formData: FormData) => void | Promise<void>;
  groups: FriendGroup[];
  renameGroupAction: (formData: FormData) => void | Promise<void>;
  updateAction: (formData: FormData) => void | Promise<void>;
};
```

4. Mantén `filterFriendGroups` intacta. Para cada entrada, renderiza el botón `Editar amigo` y abre `FriendEntrySheet` con esa entrada. Para cada grupo real, renderiza `Editar grupo` y abre `FriendGroupSheet`. No renderices renombrado para `Sin grupo`, porque `null` no es una etiqueta persistida.
5. Implementa `FriendGroupSheet` con la API:

```ts
type FriendGroupSheetProps = {
  action: (formData: FormData) => void | Promise<void>;
  currentLabel: string;
  initiallyOpen?: boolean;
  onClose?: () => void;
};
```

Debe enviar `currentLabel` y `nextLabel`, exigir un nombre no vacío y mostrar una advertencia breve: «El cambio se aplicará a todas las personas de este grupo».
6. Ejecuta el test y después:

```bash
pnpm exec vitest run src/modules/friends/ui
pnpm lint
pnpm typecheck
```

Resultado esperado: todos los tests de UI pasan; lint y typecheck terminan con código `0`.
7. Haz commit:

```bash
git add src/modules/friends/ui
git commit -m "feat(friends): expose edit controls"
```

### 7. Conectar la página `/amigos` y los mensajes de resultado

Archivos:

- `src/app/(app)/amigos/page.tsx`
- `src/app/(app)/amigos/page.module.css`

TDD:

1. Amplía el test de página existente, si existe; si no existe, crea `src/app/(app)/amigos/page.test.tsx` con el patrón usado por las páginas autenticadas. Comprueba que las acciones se pasan a `FriendsView` y que `created`, `updated` y `groupUpdated` generan mensajes de éxito.
2. Ejecuta el test. Resultado esperado antes de implementar: fallo porque `FriendsPage` solo pasa `groups`.
3. Cambia `FriendsPage` para aceptar:

```ts
type FriendsPageProps = {
  searchParams: Promise<{
    created?: string;
    error?: string;
    groupUpdated?: string;
    updated?: string;
  }>;
};
```

Pasa a `FriendsView` `createFriendEntryAction`, `updateFriendEntryAction` y `renameFriendGroupAction`. Añade `ToastFeedback` con estos textos:

```ts
const errorMessages: Record<string, string> = {
  validation: "Revisa el grupo, los adultos y los niños.",
  save: "No pudimos guardar el cambio. Prueba otra vez.",
};
```

Mensajes de éxito: `Amigo añadido.`, `Amigo actualizado.` y `Grupo actualizado.`. Conserva la comprobación de sesión y el error de carga existentes.
4. Coloca la hoja de creación dentro de la página o dentro de `FriendsView`, pero deja una sola fuente para el formulario: `FriendEntrySheet`.
5. Ejecuta:

```bash
pnpm exec vitest run 'src/app/(app)/amigos/page.test.tsx'
pnpm typecheck
pnpm lint
```

Resultado esperado: código `0` en los tres comandos.
6. Haz commit:

```bash
git add 'src/app/(app)/amigos/page.tsx' 'src/app/(app)/amigos/page.module.css' 'src/app/(app)/amigos/page.test.tsx'
git commit -m "feat(friends): connect editable friends page"
```

### 8. Cubrir la regresión de Darío y el snapshot offline

Archivos:

- `src/modules/friends/application/list-friends.test.ts`
- `src/shared/infrastructure/offline/irati-offline-db.test.ts`
- `src/app/api/offline/snapshot/route.ts` solo si una prueba demuestra que falta el dato
- `docs/spec.md` y `docs/offline-plan.md` únicamente si la especificación actual no documenta que las mutaciones de amigos requieren conexión

TDD/validación:

1. Añade un test de dominio o aplicación que construya la entrada:

```ts
const darioEntry: FriendEntry = {
  id: "palomares-coral-david",
  groupLabel: "Palomares",
  adultsLabel: "Coral y David",
  childrenLabel: "Darío, Alma y Luna",
  sortOrder: 130,
};
```

y verifique que `groupFriendEntries([darioEntry])` conserva exactamente `childrenLabel`.
2. Añade o conserva el test del snapshot que verifica que `friendEntries` se guarda y se hidrata sin perder `groupLabel`, `adultsLabel`, `childrenLabel` ni `sortOrder`.
3. Ejecuta antes de tocar producción:

```bash
pnpm exec vitest run src/modules/friends src/shared/infrastructure/offline/irati-offline-db.test.ts
```

Resultado esperado: todos los tests pasan.
4. No añadas una migración ni un seed para probar la edición. No cambies `supabase/migrations/20260920174000_restore_dario_for_coral_david.sql` ni `children_label` de la fila existente desde código de inicialización.
5. Si se actualiza documentación, ejecuta `git diff --check` y haz un commit separado:

```bash
git add docs/spec.md docs/offline-plan.md
git commit -m "docs(friends): document editable entries"
```

### 9. Validación completa y comprobación manual autenticada

Ejecutar desde `/home/rafa/dev/irati-app`:

```bash
pnpm typecheck
pnpm lint
pnpm format
pnpm test
pnpm build
git diff --check
git status --short --branch
```

Resultados esperados:

- `pnpm typecheck`: `tsc --noEmit` termina con código `0`.
- `pnpm lint`: ESLint termina con código `0`.
- `pnpm format`: Prettier termina con código `0`; si vuelve a fallar únicamente por `pnpm-lock.yaml` preexistente, comprobar que los archivos tocados sí pasan `pnpm exec prettier --check` y documentar esa limitación sin reformatear el lockfile.
- `pnpm test`: todos los tests pasan.
- `pnpm build`: build de Next termina con código `0`.
- `git diff --check`: sin salida.
- `git status --short --branch`: sin cambios pendientes.

Comprobación manual, sin crear datos de prueba basura:

1. Abrir `/amigos` autenticado y pulsar «Añadir amigo».
2. Crear una entrada real o acordada con el usuario en un grupo nuevo, por ejemplo un grupo escrito manualmente en el campo de grupo. Verificar que aparece al volver a `/amigos` y que el buscador la encuentra.
3. Editar esa entrada, cambiar sus nombres y moverla a otro grupo. Verificar que los cambios persisten tras recargar.
4. Renombrar un grupo existente que no sea `Palomares` y verificar que todas sus entradas cambian de grupo.
5. Abrir `/amigos` online para actualizar el snapshot; después comprobar que la copia offline conserva las entradas.
6. Leer de forma segura la fila `palomares-coral-david` mediante la comprobación administrativa ya disponible y confirmar que `children_label` sigue siendo exactamente `Darío, Alma y Luna`. No ejecutar una escritura de prueba sobre esa fila.

Commit final recomendado:

```bash
git add src/modules/friends src/app/'(app)'/amigos docs/spec.md docs/offline-plan.md
git commit -m "feat(friends): enable editing and new entries"
```

El implementador debe hacer `git status --short --branch` después del commit y no hacer `push` salvo que el usuario lo solicite explícitamente.

## Tests / validation

- Cada tarea de código sigue RED → GREEN → commit: primero se añade el test y se ejecuta para comprobar que falla por la ausencia del comportamiento, después se implementa lo mínimo, se vuelve a ejecutar y se hace un commit pequeño.
- Suite específica durante el desarrollo:

```bash
pnpm exec vitest run src/modules/friends
pnpm exec vitest run src/modules/friends src/shared/infrastructure/offline/irati-offline-db.test.ts
```

- Suite final obligatoria: `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm test`, `pnpm build` y `git diff --check`.
- Verificar también manualmente los casos de seguridad funcional:
  - una persona no autenticada no puede ejecutar las Server Actions;
  - adultos y niños vacíos no se guardan;
  - un grupo vacío se trata como `null`;
  - un renombrado solo afecta al grupo solicitado;
  - `Darío, Alma y Luna` no se pierde;
  - la caché se invalida después de crear, editar o renombrar.

## Risks, tradeoffs, and open questions

- Riesgo de sobrescritura de datos: mitigado usando `update` filtrado por ID y un caso separado para renombrar un grupo completo. No usar `upsert` ni editar migraciones históricas.
- Riesgo de colisión de nombres de grupo: el caso de uso debe rechazar renombrar a un grupo que ya existe, en vez de fusionarlo silenciosamente.
- Riesgo de grupo vacío: el modelo actual deriva grupos de `friend_entries`. Si se necesita crear grupos vacíos, habrá que confirmar ese requisito y añadir una tabla `friend_groups` con orden, CRUD y relación; no debe improvisarse dentro de esta entrega.
- Riesgo de formato de niños: `children_label` sigue siendo texto libre. Esto permite guardar «Adriana y Julia» o «Darío, Alma y Luna» sin una migración, pero no permite editar cada niño como entidad independiente ni consultar parentescos de forma estructurada.
- Riesgo offline: una edición hecha sin conexión no se encola. La UI debe indicarlo claramente y solo el snapshot previamente sincronizado estará disponible offline.
- Orden: las entradas nuevas usan el siguiente `sort_order` global. No se añade reordenación por grupos hasta que sea necesaria.
- Seguridad: la tabla revoca permisos a `anon` y `authenticated`; las Server Actions deben mantener el patrón actual de cliente Supabase de servidor y sesión válida. No añadir credenciales, logs de payloads ni endpoints públicos.
- Pregunta abierta para una siguiente iteración: ¿se necesita borrar entradas o grupos? No se incluye ahora porque la petición solo pide añadir y editar; si se pide, requerirá confirmación explícita y pruebas de impacto sobre el snapshot offline y backups.
