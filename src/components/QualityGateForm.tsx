import { useEffect, useState, type ChangeEvent, type FC, type FormEvent } from 'react';
import clsx from 'clsx';
import type { QualityGateConfig } from '../api/types';

type QualityGateFormProps = {
  config: QualityGateConfig | null;
  onSubmit: (config: QualityGateConfig) => Promise<void>;
  saving?: boolean;
  message?: { type: 'success' | 'error'; text: string } | null;
};

const defaultConfig: QualityGateConfig = {
  enabled: true,
  max_critical: 0,
  max_high: 0,
  max_medium: 0,
  max_low: 0,
  fail_on_secrets: false,
  fail_on_critical_code_issues: false,
};

export const QualityGateForm: FC<QualityGateFormProps> = ({ config, onSubmit, saving, message }) => {
  const [formState, setFormState] = useState<QualityGateConfig>(config ?? defaultConfig);

  useEffect(() => {
    setFormState(config ?? defaultConfig);
  }, [config]);

  const handleNumberChange = (key: keyof Pick<QualityGateConfig, 'max_critical' | 'max_high' | 'max_medium' | 'max_low'>) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Math.max(0, Number(event.target.value));
      setFormState((prev) => ({ ...prev, [key]: Number.isFinite(value) ? value : 0 }));
    };

  const handleToggle = (
    key: keyof Pick<QualityGateConfig, 'enabled' | 'fail_on_secrets' | 'fail_on_critical_code_issues'>,
  ) => () => {
    setFormState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(formState);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <ToggleField
          label="Quality gates enabled"
          description="Disable to bypass enforcement for all runs."
          checked={formState.enabled}
          onToggle={handleToggle('enabled')}
        />
        <ToggleField
          label="Fail on secrets"
          description="Mark runs as failed whenever secrets are detected."
          checked={formState.fail_on_secrets}
          onToggle={handleToggle('fail_on_secrets')}
        />
        <ToggleField
          label="Fail on critical code issues"
          description="Stop the pipeline when a critical code finding is reported."
          checked={formState.fail_on_critical_code_issues}
          onToggle={handleToggle('fail_on_critical_code_issues')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField
          label="Max critical findings"
          value={formState.max_critical}
          onChange={handleNumberChange('max_critical')}
        />
        <NumberField
          label="Max high findings"
          value={formState.max_high}
          onChange={handleNumberChange('max_high')}
        />
        <NumberField
          label="Max medium findings"
          value={formState.max_medium}
          onChange={handleNumberChange('max_medium')}
        />
        <NumberField
          label="Max low findings"
          value={formState.max_low}
          onChange={handleNumberChange('max_low')}
        />
      </div>

      {message && (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border border-success/40 bg-success/10 text-success'
              : 'border border-danger/40 bg-danger/10 text-danger'
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/60 bg-accent/10 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-accent transition hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
};

type ToggleFieldProps = {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
};

const ToggleField: FC<ToggleFieldProps> = ({ label, description, checked, onToggle }) => (
  <div className="flex h-full flex-col justify-between gap-4 rounded-3xl border-2 border-accent/40 bg-slate-50/95 p-5 shadow-[0_20px_40px_-35px_rgba(99,102,241,0.6)]">
    <div className="space-y-2">
      <p className="text-sm font-semibold leading-snug text-slate-900">{label}</p>
      <p className="text-xs leading-relaxed text-slate-600">{description}</p>
    </div>
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        'flex h-7 w-14 shrink-0 items-center rounded-full px-1 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        checked
          ? 'justify-end bg-accent/90 text-white shadow-[0_18px_36px_-20px_rgba(99,102,241,0.8)]'
          : 'justify-start bg-slate-300/80 text-slate-600',
      )}
      aria-pressed={checked}
    >
      <span className="sr-only">Toggle {label}</span>
      <span className="h-5 w-5 rounded-full bg-white shadow transition-all duration-300" />
    </button>
  </div>
);

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

const NumberField: FC<NumberFieldProps> = ({ label, value, onChange }) => (
  <label className="flex h-full min-h-[128px] flex-col justify-between gap-3 rounded-3xl border-2 border-accent/40 bg-slate-50/95 p-4 shadow-[0_20px_40px_-35px_rgba(99,102,241,0.6)]">
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span>
    <input
      type="number"
      min={0}
      value={value}
      onChange={onChange}
      className="w-full rounded-2xl border-2 border-accent/40 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
    />
  </label>
);

