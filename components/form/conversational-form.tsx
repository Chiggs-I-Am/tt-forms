import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Categorization, getAjv, isVisible, LayoutProps, RankedTester, rankWith, and, uiTypeIs, categorizationHasCategory, optionIs } from "@jsonforms/core";
import { JsonFormsDispatch, useJsonForms, withJsonFormsLayoutProps } from "@jsonforms/react";
import { SelectedIndexContext, ShowPreviewContext } from "@components/form/dynamic-form";
import useJoinClassNames from "@utils/joinClasses";
import ChatMessage from "./chat-message";
import ChatInput from "./chat-input";
import ProgressIndicator from "./progress-indicator";

export interface ConversationalFormProps extends LayoutProps {
  data?: any;
}

interface ConversationMessage {
  id: string;
  type: "bot" | "user";
  content: string;
  timestamp: Date;
  sectionIndex?: number;
}

function ConversationalForm(props: ConversationalFormProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { showPreview, setShowPreview } = useContext(ShowPreviewContext);
  const { sectionIndex, setSectionIndex } = useContext(SelectedIndexContext);

  const joinClassNames = useJoinClassNames();

  const { data, path, schema, uischema } = props;
  const categorization = uischema as Categorization;

  const jsonFormState = useJsonForms();
  const ajv = getAjv({ jsonforms: { ...jsonFormState } });

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const askCurrentSectionQuestion = useCallback(() => {
    if (currentSectionIndex >= categorization.elements.length) {
      // All sections completed
      const completionMessage: ConversationMessage = {
        id: `completion-${Date.now()}`,
        type: "bot",
        content: "Great! You've completed all sections. Would you like to review your answers before submitting?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, completionMessage]);
      setIsWaitingForInput(true);
      return;
    }

    const currentSection = categorization.elements[currentSectionIndex];
    if (!isVisible(currentSection, data, path, ajv)) {
      // Skip hidden sections
      setCurrentSectionIndex(prev => prev + 1);
      return;
    }

    setIsTyping(true);
    
    setTimeout(() => {
      const questionMessage: ConversationMessage = {
        id: `question-${currentSectionIndex}-${Date.now()}`,
        type: "bot",
        content: `Let's fill out the "${currentSection.label}" section. Please provide the required information.`,
        timestamp: new Date(),
        sectionIndex: currentSectionIndex
      };
      
      setMessages(prev => [...prev, questionMessage]);
      setIsTyping(false);
      setIsWaitingForInput(true);
    }, 1000);
  }, [currentSectionIndex, categorization.elements, data, path, ajv]);

  // Initialize conversation with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ConversationMessage = {
        id: "welcome",
        type: "bot",
        content: `Hello! I'll help you complete your ${categorization.label || "form"}. Let's start with the first section.`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      
      // Add first question after a short delay
      setTimeout(() => {
        askCurrentSectionQuestion();
      }, 1000);
    }
  }, [messages.length, categorization.label, askCurrentSectionQuestion]);

  // Sync with external section changes
  useEffect(() => {
    if (sectionIndex !== undefined && sectionIndex !== currentSectionIndex) {
      setCurrentSectionIndex(sectionIndex);
    }
  }, [sectionIndex, currentSectionIndex]);

  const handleUserMessage = useCallback((message: string) => {
    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsWaitingForInput(false);

    // Process the user's response
    setTimeout(() => {
      if (currentSectionIndex >= categorization.elements.length) {
        // Handle completion flow
        if (message.toLowerCase().includes("yes") || message.toLowerCase().includes("review")) {
          setShowPreview(true);
        } else {
          // Submit directly or handle other responses
          const submitMessage: ConversationMessage = {
            id: `submit-${Date.now()}`,
            type: "bot",
            content: "Thank you! Your form has been submitted successfully.",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, submitMessage]);
        }
      } else {
        // Move to next section
        const nextIndex = currentSectionIndex + 1;
        setCurrentSectionIndex(nextIndex);
        setSectionIndex(nextIndex);
        
        const acknowledgmentMessage: ConversationMessage = {
          id: `ack-${Date.now()}`,
          type: "bot",
          content: "Thank you! Let's continue with the next section.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, acknowledgmentMessage]);
        
        // Ask next question
        setTimeout(() => {
          askCurrentSectionQuestion();
        }, 1000);
      }
    }, 500);
  }, [currentSectionIndex, categorization.elements.length, setShowPreview, setSectionIndex, askCurrentSectionQuestion]);

  const handleGoBack = useCallback(() => {
    if (currentSectionIndex > 0) {
      const prevIndex = currentSectionIndex - 1;
      setCurrentSectionIndex(prevIndex);
      setSectionIndex(prevIndex);
      
      const backMessage: ConversationMessage = {
        id: `back-${Date.now()}`,
        type: "bot",
        content: `Let's go back to the "${categorization.elements[prevIndex].label}" section.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, backMessage]);
      setIsWaitingForInput(true);
    }
  }, [currentSectionIndex, categorization.elements, setSectionIndex]);

  // Generate progress steps
  const progressSteps = categorization.elements.map((element, index) => ({
    label: element.label || `Step ${index + 1}`,
    completed: index < currentSectionIndex,
    current: index === currentSectionIndex
  }));

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
      {/* Progress Indicator */}
      <ProgressIndicator 
        steps={progressSteps}
        currentStep={currentSectionIndex + 1}
        totalSteps={categorization.elements.length}
      />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            type={message.type}
            content={message.content}
            timestamp={message.timestamp}
          />
        ))}
        
        {isTyping && (
          <ChatMessage
            type="bot"
            content=""
            isTyping={true}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Current Form Section */}
      {currentSectionIndex < categorization.elements.length && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              {categorization.elements[currentSectionIndex].label}
            </h3>
            <JsonFormsDispatch
              uischema={categorization.elements[currentSectionIndex]}
              schema={schema}
              path={path}
            />
          </div>
        </div>
      )}

      {/* Chat Input */}
      {isWaitingForInput && (
        <ChatInput
          onSend={handleUserMessage}
          placeholder="Type your response..."
          disabled={!isWaitingForInput}
        />
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleGoBack}
          disabled={currentSectionIndex === 0}
          className={joinClassNames(
            "px-4 py-2 text-sm font-medium rounded-lg border",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
            "hover:bg-gray-50 dark:hover:bg-gray-800"
          )}
        >
          Back
        </button>

        <button
          onClick={() => {
            const nextIndex = currentSectionIndex + 1;
            setCurrentSectionIndex(nextIndex);
            setSectionIndex(nextIndex);
            askCurrentSectionQuestion();
          }}
          disabled={currentSectionIndex >= categorization.elements.length}
          className={joinClassNames(
            "px-4 py-2 text-sm font-medium rounded-lg",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "bg-blue-500 text-white hover:bg-blue-600"
          )}
        >
          {currentSectionIndex >= categorization.elements.length - 1 ? "Review" : "Next"}
        </button>
      </div>
    </div>
  );
}

export default withJsonFormsLayoutProps(ConversationalForm);

export const ConversationalFormTester: RankedTester = rankWith(
  3,
  and(
    uiTypeIs("Categorization"),
    categorizationHasCategory,
    optionIs("variant", "conversational")
  )
);