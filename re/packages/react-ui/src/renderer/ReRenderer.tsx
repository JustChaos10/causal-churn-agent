import React from 'react';
import { Component } from '@re/core';
import { ComponentRenderer } from './ComponentRenderer';

export interface ReRendererProps {
  components: Component[];
  onAction?: (actionId: string, data?: any) => void;
  className?: string;
}

export function ReRenderer({ components, onAction, className }: ReRendererProps) {
  return (
    <div className={className}>
      {components.map((component) => (
        <ComponentRenderer key={component.id} component={component} onAction={onAction} />
      ))}
    </div>
  );
}
