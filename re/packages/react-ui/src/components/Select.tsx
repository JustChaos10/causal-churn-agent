import React from 'react';
import { SelectComponent } from '@re/core';

export interface SelectProps {
  props: SelectComponent['props'];
  onInputChange?: (name: string, value: string) => void;
}

export function Select({ props, onInputChange }: SelectProps) {
  const { name, label, options, required, defaultValue } = props;

  return (
    <div className="re-form-group">
      <label htmlFor={name} className="re-form-label">
        {label}
        {required && <span style={{ color: 'var(--re-error)' }}> *</span>}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="re-form-select"
        onChange={(e) => onInputChange?.(name, e.target.value)}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
