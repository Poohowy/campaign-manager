import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
        <Input id="template-name" {...form.register('name')} />
        {form.formState.errors.name ? (
          <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="template-subject">Subject</Label>
        <Input id="template-subject" {...form.register('subject')} />
        {form.formState.errors.subject ? (
          <p className="text-sm text-red-600">{form.formState.errors.subject.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="template-body">Body (Markdown)</Label>
        <Textarea id="template-body" rows={8} {...form.register('body_markdown')} />
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
