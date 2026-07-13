import { Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Switch } from 'movies-tracker'

// Switch is a 36×20px track — it only reads as a control next to the setting it toggles.
// These are the rows it fills on the Settings page.

export function PrivacySettings() {
  const rows = [
    {
      id: 'sw-public',
      label: 'Public profile',
      hint: 'Anyone with your link can see your stats',
      on: true,
    },
    {
      id: 'sw-leaderboard',
      label: 'Join the leaderboard',
      hint: 'Your display name and movie count become public',
      on: true,
    },
    {
      id: 'sw-costs',
      label: 'Show ticket costs',
      hint: 'Include what you paid on your public watch history',
      on: false,
    },
  ]
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Privacy</CardTitle>
        <CardDescription>Control what /u/siv19 shows to visitors</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {rows.map((r) => (
          <div key={r.id} className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor={r.id}>{r.label}</Label>
              <p className="text-xs text-muted-foreground">{r.hint}</p>
            </div>
            <Switch id={r.id} defaultChecked={r.on} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function States() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <div className="flex items-center gap-3">
        <Switch id="sw-off" />
        <Label htmlFor="sw-off">Off — hide my watch history</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="sw-on" defaultChecked />
        <Label htmlFor="sw-on">On — public profile</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="sw-off-disabled" disabled />
        <Label htmlFor="sw-off-disabled">Disabled — email digests (verify first)</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="sw-on-disabled" defaultChecked disabled />
        <Label htmlFor="sw-on-disabled">Disabled &amp; on — admin audit log</Label>
      </div>
    </div>
  )
}

export function InlineToggle() {
  return (
    <div className="flex max-w-sm items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Dark theme</span>
        <span className="text-xs text-muted-foreground">Match the cinema, not the lobby</span>
      </div>
      <Switch id="sw-theme" defaultChecked />
    </div>
  )
}
