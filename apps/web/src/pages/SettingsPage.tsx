import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

type SettingsPageProps = {
  theme: 'light' | 'dark';
  onThemeChange: (nextTheme: 'light' | 'dark') => void;
};

export function SettingsPage({ theme, onThemeChange }: SettingsPageProps) {
  return (
    <div className="page-stack">
      <h2>Settings</h2>
      <p className="page-description">
        UI preferences are previewable here. Account and backend settings are not implemented yet.
      </p>

      <Card title="Appearance">
        <div className="settings-row">
          <div>
            <strong>Theme</strong>
            <p>Choose between light and dark UI themes.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
