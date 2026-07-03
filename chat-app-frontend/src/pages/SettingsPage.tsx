import { ThemeSelector } from "@/shared/ui/ThemeSelector";

export default function SettingsPage() {
  return (
    <div className="h-full w-full overflow-auto p-4">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 py-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your app preferences
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-md font-medium">Appearance</h2>
            <p className="text-xs text-muted-foreground md:text-sm">
              Choose how Chikamo looks to you. Select a theme.
            </p>
          </div>
          <ThemeSelector />
        </section>
      </div>
    </div>
  );
}
