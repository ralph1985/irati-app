import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import type { Database } from "@/shared/infrastructure/supabase/database.types";
import { SupabaseFriendRepository } from "./supabase-friend-repository";

const row = {
  id: "friend-1",
  group_label: "Kamikazes",
  adults_label: "Jota y Paula",
  children_label: "Leire",
  sort_order: 10,
};

function repositoryFrom(query: Record<string, unknown>) {
  const supabase = {
    from: vi.fn(() => query),
  } as unknown as SupabaseClient<Database>;

  return { repository: new SupabaseFriendRepository(supabase), supabase };
}

describe("SupabaseFriendRepository mutations", () => {
  it("inserts and maps a new entry", async () => {
    const query = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: row, error: null }),
    };
    const { repository } = repositoryFrom(query);

    await expect(
      repository.createFriendEntry({
        adultsLabel: "Jota y Paula",
        childrenLabel: "Leire",
        groupLabel: "Kamikazes",
        id: "friend-1",
        sortOrder: 10,
      }),
    ).resolves.toEqual({
      adultsLabel: "Jota y Paula",
      childrenLabel: "Leire",
      groupLabel: "Kamikazes",
      id: "friend-1",
      sortOrder: 10,
    });
    expect(query.insert).toHaveBeenCalledWith({
      adults_label: "Jota y Paula",
      children_label: "Leire",
      group_label: "Kamikazes",
      id: "friend-1",
      sort_order: 10,
    });
  });

  it("updates one entry by its exact id", async () => {
    const query = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: row, error: null }),
    };
    const { repository } = repositoryFrom(query);

    await repository.updateFriendEntry("friend-1", {
      adultsLabel: "Jota y Paula",
      childrenLabel: "Leire",
      groupLabel: "Kamikazes",
    });

    expect(query.eq).toHaveBeenCalledWith("id", "friend-1");
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        adults_label: "Jota y Paula",
        children_label: "Leire",
        group_label: "Kamikazes",
        updated_at: expect.any(String),
      }),
    );
  });

  it("renames every entry in a group", async () => {
    const query = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    const { repository } = repositoryFrom(query);

    await repository.renameFriendGroup("Kamikazes", "Amigos del parque");

    expect(query.eq).toHaveBeenCalledWith("group_label", "Kamikazes");
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        group_label: "Amigos del parque",
        updated_at: expect.any(String),
      }),
    );
  });
});
