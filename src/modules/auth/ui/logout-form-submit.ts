export async function clearAndSubmitLogout(
  form: Pick<HTMLFormElement, "submit">,
  clearData: () => Promise<void>,
): Promise<void> {
  await clearData();
  form.submit();
}
