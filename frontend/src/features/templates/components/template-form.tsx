import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import ReactMarkdown from 'react-markdown'
import { z } from 'zod'
import { Alert } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Spinner } from '../../../components/ui/spinner'
import { Textarea } from '../../../components/ui/textarea'

const templateFormSchema = z.object({
  name: z.string().trim().min(1, 'Template name is required.'),
  subject: z.string().trim().min(1, 'Subject is required.'),
  body_markdown: z.string().trim().min(1, 'Body is required.'),
})

export type TemplateFormValues = z.infer<typeof templateFormSchema>
type VariableTarget = 'subject' | 'body_markdown'

type CursorSelection = {
  start: number
  end: number
}

const SUPPORTED_VARIABLES = [
  '{{company_name}}',
  '{{contact_name}}',
  '{{email}}',
  '{{phone}}',
  '{{website}}',
  '{{city}}',
  '{{country}}',
]

type VariablePickerProps = {
  isOpen: boolean
  triggerAriaLabel: string
  onToggle: () => void
  onInsert: (variable: string) => void
}

function VariablePicker({ isOpen, triggerAriaLabel, onToggle, onInsert }: VariablePickerProps) {
  return (
    <div className="relative">
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label={triggerAriaLabel}
        onClick={onToggle}
      >
        Insert Variable
      </Button>
      {isOpen ? (
        <div className="absolute right-0 z-10 mt-2 w-52 rounded-md border border-slate-200 bg-white p-2 shadow-md">
          <div className="space-y-1">
            {SUPPORTED_VARIABLES.map((variable) => (
              <button
                key={variable}
                type="button"
                className="w-full rounded px-2 py-1 text-left text-sm text-slate-700 hover:bg-slate-100"
                onClick={() => onInsert(variable)}
              >
                {variable}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

type TemplateFormProps = {
  mode: 'create' | 'edit'
  initialValues?: TemplateFormValues
  isSubmitting: boolean
  errorMessage: string | null
  onCancel: () => void
  onSubmit: (values: TemplateFormValues) => Promise<void>
}

export function TemplateForm({
  mode,
  initialValues,
  isSubmitting,
  errorMessage,
  onCancel,
  onSubmit,
}: TemplateFormProps) {
  const subjectInputRef = useRef<HTMLInputElement | null>(null)
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [openVariablePicker, setOpenVariablePicker] = useState<VariableTarget | null>(null)
  const [bodyTab, setBodyTab] = useState<'edit' | 'preview'>('edit')
  const [subjectSelection, setSubjectSelection] = useState<CursorSelection>({ start: 0, end: 0 })
  const [bodySelection, setBodySelection] = useState<CursorSelection>({ start: 0, end: 0 })

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: initialValues ?? {
      name: '',
      subject: '',
      body_markdown: '',
    },
  })

  useEffect(() => {
    form.reset(
      initialValues ?? {
        name: '',
        subject: '',
        body_markdown: '',
      },
    )
  }, [form, initialValues])

  const nameField = form.register('name')
  const subjectField = form.register('subject')
  const bodyField = form.register('body_markdown')

  const rememberSelection = (target: VariableTarget, start: number, end: number) => {
    const selection = { start, end }
    if (target === 'subject') {
      setSubjectSelection(selection)
      return
    }
    setBodySelection(selection)
  }

  const insertVariableAtCursor = (target: VariableTarget, variable: string) => {
    const currentValue = form.getValues(target) ?? ''
    const remembered = target === 'subject' ? subjectSelection : bodySelection
    let { start, end } = remembered

    if (start < 0 || end < 0 || start > currentValue.length || end > currentValue.length || end < start) {
      start = currentValue.length
      end = currentValue.length
    }

    const nextValue = `${currentValue.slice(0, start)}${variable}${currentValue.slice(end)}`
    const nextCursorPosition = start + variable.length

    form.setValue(target, nextValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    rememberSelection(target, nextCursorPosition, nextCursorPosition)
    setOpenVariablePicker(null)

    requestAnimationFrame(() => {
      const element = target === 'subject' ? subjectInputRef.current : bodyTextareaRef.current
      if (!element) {
        return
      }
      element.focus()
      element.setSelectionRange(nextCursorPosition, nextCursorPosition)
    })
  }

  const bodyValue = useWatch({
    control: form.control,
    name: 'body_markdown',
  })
  const submitLabel = mode === 'create' ? 'Create Template' : 'Save Changes'
  const submittingLabel = mode === 'create' ? 'Creating...' : 'Saving...'

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        void form.handleSubmit(onSubmit)(event)
      }}
      noValidate
    >
      {errorMessage ? <Alert variant="destructive">{errorMessage}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="template-name">Template Name</Label>
        <Input id="template-name" {...nameField} />
        {form.formState.errors.name ? (
          <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="template-subject">Subject</Label>
          <VariablePicker
            isOpen={openVariablePicker === 'subject'}
            triggerAriaLabel="Insert Variable (Subject)"
            onToggle={() =>
              setOpenVariablePicker((current) => (current === 'subject' ? null : 'subject'))
            }
            onInsert={(variable) => insertVariableAtCursor('subject', variable)}
          />
        </div>
        <Input
          id="template-subject"
          {...subjectField}
          ref={(element) => {
            subjectInputRef.current = element
            subjectField.ref(element)
          }}
          onClick={(event) => {
            rememberSelection(
              'subject',
              event.currentTarget.selectionStart ?? 0,
              event.currentTarget.selectionEnd ?? 0,
            )
          }}
          onKeyUp={(event) => {
            rememberSelection(
              'subject',
              event.currentTarget.selectionStart ?? 0,
              event.currentTarget.selectionEnd ?? 0,
            )
          }}
          onSelect={(event) => {
            rememberSelection(
              'subject',
              event.currentTarget.selectionStart ?? 0,
              event.currentTarget.selectionEnd ?? 0,
            )
          }}
        />
        {form.formState.errors.subject ? (
          <p className="text-sm text-red-600">{form.formState.errors.subject.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="template-body">Body (Markdown)</Label>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-slate-200 bg-white p-1">
              <button
                type="button"
                className={`rounded px-3 py-1 text-sm ${
                  bodyTab === 'edit' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
                onClick={() => setBodyTab('edit')}
              >
                Edit
              </button>
              <button
                type="button"
                className={`rounded px-3 py-1 text-sm ${
                  bodyTab === 'preview'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                onClick={() => setBodyTab('preview')}
              >
                Preview
              </button>
            </div>
            <VariablePicker
              isOpen={openVariablePicker === 'body_markdown'}
              triggerAriaLabel="Insert Variable (Body)"
              onToggle={() =>
                setOpenVariablePicker((current) => (current === 'body_markdown' ? null : 'body_markdown'))
              }
              onInsert={(variable) => insertVariableAtCursor('body_markdown', variable)}
            />
          </div>
        </div>
        {bodyTab === 'edit' ? (
          <Textarea
            id="template-body"
            rows={8}
            {...bodyField}
            ref={(element) => {
              bodyTextareaRef.current = element
              bodyField.ref(element)
            }}
            onClick={(event) => {
              rememberSelection(
                'body_markdown',
                event.currentTarget.selectionStart ?? 0,
                event.currentTarget.selectionEnd ?? 0,
              )
            }}
            onKeyUp={(event) => {
              rememberSelection(
                'body_markdown',
                event.currentTarget.selectionStart ?? 0,
                event.currentTarget.selectionEnd ?? 0,
              )
            }}
            onSelect={(event) => {
              rememberSelection(
                'body_markdown',
                event.currentTarget.selectionStart ?? 0,
                event.currentTarget.selectionEnd ?? 0,
              )
            }}
          />
        ) : (
          <div className="min-h-28 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
            {bodyValue?.trim() ? (
              <ReactMarkdown>{bodyValue}</ReactMarkdown>
            ) : (
              <p className="text-slate-500">Nothing to preview yet.</p>
            )}
          </div>
        )}
        {form.formState.errors.body_markdown ? (
          <p className="text-sm text-red-600">{form.formState.errors.body_markdown.message}</p>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner />
              {submittingLabel}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  )
}
