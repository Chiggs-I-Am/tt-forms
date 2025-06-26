# Conversational Form Usage

The conversational form provides a chat-like interface for filling out forms. Here's how to use it:

## Basic Usage

To use the conversational form, set the `variant` option to `"conversational"` in your UI schema:

```typescript
const uischema = {
  type: "Categorization",
  elements: [
    {
      type: "Category",
      label: "Personal Information",
      elements: [
        {
          type: "Control",
          label: "First name",
          scope: "#/properties/name/properties/firstName"
        },
        {
          type: "Control",
          label: "Last name",
          scope: "#/properties/name/properties/lastName"
        }
      ]
    }
  ],
  options: { 
    variant: "conversational" // This enables the conversational interface
  }
};
```

## Components

### ConversationalForm
The main component that renders the chat interface:
- Displays progress indicator at the top
- Shows chat messages between bot and user
- Renders current form section
- Provides navigation controls

### ProgressIndicator
Shows progress through form steps:
- Progress bar with percentage completion
- Step indicators with completed/current states
- Step counter (e.g., "2 of 5")

### ChatMessage
Individual message component:
- Supports bot and user message types
- Includes timestamps
- Shows typing animation for bot

### ChatInput
Chat-style input for user responses:
- Enter key to send
- Send button with airplane icon
- Support for multiline input

## Features

- **Real-time validation**: Uses existing JsonForms validation system
- **Navigation**: Back/Next buttons and programmatic navigation
- **Progress tracking**: Visual progress indicator
- **Responsive design**: Works on mobile and desktop
- **Dark mode support**: Follows Tailwind dark mode classes
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Integration

The conversational form integrates seamlessly with the existing DynamicForm system:

```typescript
import DynamicForm from "@components/form/dynamic-form";

// The DynamicForm will automatically use ConversationalForm 
// when variant: "conversational" is specified
<DynamicForm schema={schema} uischema={conversationalUiSchema} />
```

## Storybook Stories

Check out the Storybook stories for examples:
- `ProgressIndicator.stories.tsx` - Progress indicator variations
- `ChatMessage.stories.tsx` - Message types and conversation examples  
- `ConversationalForm.stories.tsx` - Full conversational form examples
- `ConversationalFormIntegration.stories.tsx` - Integration with DynamicForm