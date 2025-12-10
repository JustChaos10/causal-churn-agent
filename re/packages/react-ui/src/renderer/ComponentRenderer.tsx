import React from 'react';
import { Component } from '@re/core';
import * as Components from '../components';

export interface ComponentRendererProps {
  component: Component;
  onAction?: (actionId: string, data?: any) => void;
  onInputChange?: (name: string, value: any) => void;
}

export function ComponentRenderer({
  component,
  onAction,
  onInputChange,
}: ComponentRendererProps) {
  switch (component.type) {
    case 'text':
      return <Components.Text props={component.props} />;

    case 'heading':
      return <Components.Heading props={component.props} />;

    case 'button':
      return <Components.Button props={component.props} onAction={onAction} />;

    case 'card':
      return <Components.Card component={component} onAction={onAction} />;

    case 'list':
      return <Components.List props={component.props} />;

    case 'table':
      return <Components.Table props={component.props} />;

    case 'chart':
      return <Components.Chart props={component.props} />;

    case 'form':
      return <Components.Form component={component} onAction={onAction} />;

    case 'input':
      return <Components.Input props={component.props} onInputChange={onInputChange} />;

    case 'select':
      return <Components.Select props={component.props} onInputChange={onInputChange} />;

    case 'alert':
      return <Components.Alert props={component.props} />;

    case 'progress':
      return <Components.Progress props={component.props} />;

    case 'badge':
      return <Components.Badge props={component.props} />;

    case 'image':
      return <Components.Image props={component.props} />;

    case 'divider':
      return <Components.Divider props={component.props} />;

    case 'container':
      return <Components.Container component={component} onAction={onAction} />;

    default:
      console.warn(`Unknown component type: ${(component as any).type}`);
      return null;
  }
}
