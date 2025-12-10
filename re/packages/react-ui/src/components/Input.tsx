import React from 'react';
import { InputComponent } from '@re/core';

export interface InputProps {
  props: InputComponent['props'];
  onInputChange?: (name: string, value: string) => void;
}

export function Input({ props, onInputChange }: InputProps) {
  const { name, label, placeholder, type = 'text', required, defaultValue } = props;

  return (
    <div className="re-form-group">
      <label htmlFor={name} className="re-form-label">
        {label}
        {required && <span style={{ color: 'var(--re-error)' }}> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        className="re-form-input"
        onChange={(e) => onInputChange?.(name, e.target.value)}
      />
    </div>
  );
}
