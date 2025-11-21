"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { getCurrentAgentLanguage } from '@/lib/communication-history-utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Globe, CheckCircle, XCircle } from 'lucide-react';

interface TranslationDebugProps {
  className?: string;
}

/**
 * TranslationDebug - Development component to verify translation system
 *
 * This component helps verify that:
 * 1. React context translations are working
 * 2. Global translations are properly injected
 * 3. All event types have proper translations
 * 4. Badge components show translated text
 *
 * Remove this component in production!
 */
export function TranslationDebug({ className }: TranslationDebugProps) {
  const { t, language, setLanguage } = useLanguage();
  const [globalTranslations, setGlobalTranslations] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    // Check global translations
    if (typeof window !== 'undefined') {
      const global = (globalThis as any).translations;
      setGlobalTranslations(global);
    }
  }, [language]);

  useEffect(() => {
    runTranslationTests();
  }, [language, globalTranslations]);

  const runTranslationTests = () => {
    const results = [];

    // Test 1: Check if global translations exist
    results.push({
      name: 'Global translations available',
      status: globalTranslations?.[language] ? 'pass' : 'fail',
      details: globalTranslations?.[language] ? '✅ Found' : '❌ Missing'
    });

    // Test 2: Check event types translations
    const eventTypes = ['priority_changed', 'stage_changed', 'follow_up_cancelled', 'follow_up_rescheduled'];
    const eventTypeTests = eventTypes.map(eventType => ({
      name: `Event type: ${eventType}`,
      status: t.leads?.eventTypes?.[eventType] ? 'pass' : 'fail',
      details: t.leads?.eventTypes?.[eventType] || 'Missing'
    }));
    results.push(...eventTypeTests);

    // Test 3: Check priority translations
    const priorities = ['priorityHot', 'priorityWarm', 'priorityCold'];
    const priorityTests = priorities.map(priority => ({
      name: `Priority: ${priority}`,
      status: t.leads?.[priority] ? 'pass' : 'fail',
      details: t.leads?.[priority] || 'Missing'
    }));
    results.push(...priorityTests);

    // Test 4: Check stage translations
    const stages = ['newLead', 'contacted', 'qualified', 'viewingScheduled'];
    const stageTests = stages.map(stage => ({
      name: `Stage: ${stage}`,
      status: t.leads?.stages?.[stage] ? 'pass' : 'fail',
      details: t.leads?.stages?.[stage] || 'Missing'
    }));
    results.push(...stageTests);

    setTestResults(results);
  };

  const getEventTranslationExample = () => {
    const examples = [
      { type: 'priority_changed', pt: 'Prioridade Alterada', en: 'Priority Changed' },
      { type: 'stage_changed', pt: 'Estágio Alterado', en: 'Stage Changed' },
      { type: 'follow_up_cancelled', pt: 'Acompanhamento Cancelado', en: 'Follow-up Cancelled' },
      { type: 'follow_up_rescheduled', pt: 'Acompanhamento Reagendado', en: 'Follow-up Rescheduled' }
    ];

    return examples.map(example => ({
      ...example,
      current: t.leads?.eventTypes?.[example.type] || 'Missing'
    }));
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className={className}>
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Translation Debug (Dev Only)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Current: {language}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
                className="text-xs"
              >
                Switch to {language === 'pt' ? 'EN' : 'PT'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Global Translations Status */}
          <div className="flex items-center gap-2 text-xs">
            {globalTranslations?.[language] ? (
              <>
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-green-700 dark:text-green-400">
                  Global translations available
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 text-red-600" />
                <span className="text-red-700 dark:text-red-400">
                  Global translations missing
                </span>
              </>
            )}
          </div>

          {/* Test Results */}
          <div className="space-y-1">
            <h4 className="text-xs font-semibold mb-2">Translation Tests:</h4>
            {testResults.map((test, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="truncate flex-1">{test.name}</span>
                <div className="flex items-center gap-1 ml-2">
                  {test.status === 'pass' ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span className="text-muted-foreground max-w-20 truncate">
                    {test.details}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Event Translation Examples */}
          <div className="space-y-1">
            <h4 className="text-xs font-semibold mb-2">Event Type Examples:</h4>
            {getEventTranslationExample().map((example, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="font-mono">{example.type}</span>
                <Badge
                  variant={example.current === example[language] ? "default" : "destructive"}
                  className="text-xs"
                >
                  {example.current}
                </Badge>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <div className="pt-2 border-t border-yellow-200 dark:border-yellow-800">
            <Button
              variant="outline"
              size="sm"
              onClick={runTranslationTests}
              className="w-full text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Re-run Tests
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}