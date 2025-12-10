import React, { useState, FormEvent } from 'react';
import { FormComponent } from '@re/core';
import { ComponentRenderer } from '../renderer';

export interface FormProps {
  component: FormComponent;
  onAction?: (actionId: string, data?: any) => void;
}

export function Form({ component, onAction }: FormProps) {
  const { props, children = [] } = component;
  const { title, submitLabel = 'Submit', onSubmit } = props || {};
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (onSubmit && onAction) {
      onAction(onSubmit, formData);
    }
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form className="re-form" onSubmit={handleSubmit}>
      {title && <h3 className="re-form-title">{title}</h3>}
      {children.map((child) => (
        <ComponentRenderer
          key={child.id}
          component={child}
          onAction={onAction}
          onInputChange={handleInputChange}
        />
      ))}
      <button type="submit" className="re-button re-button-primary re-button-md">
        {submitLabel}
      </button>
    </form>
  );
}
