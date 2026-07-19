import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { TemplateForm } from './template-form'

describe('TemplateForm', () => {
  it('inserts variables at cursor position for subject and body', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <TemplateForm
        mode="create"
        isSubmitting={false}
        errorMessage={null}
        onCancel={() => undefined}
        onSubmit={onSubmit}
      />,
    )

    const subjectInput = screen.getByLabelText('Subject')
    if (!(subjectInput instanceof HTMLInputElement)) {
      throw new Error('Expected subject input to be an HTMLInputElement.')
    }
    fireEvent.change(subjectInput, { target: { value: 'Hello ' } })
    subjectInput.focus()
    subjectInput.setSelectionRange(6, 6)
    fireEvent.select(subjectInput)

    fireEvent.click(screen.getByRole('button', { name: 'Insert Variable (Subject)' }))
    fireEvent.click(screen.getByRole('button', { name: '{{company_name}}' }))
    expect(subjectInput).toHaveValue('Hello {{company_name}}')

    const bodyTextarea = screen.getByLabelText('Body (Markdown)')
    if (!(bodyTextarea instanceof HTMLTextAreaElement)) {
      throw new Error('Expected body field to be an HTMLTextAreaElement.')
    }
    fireEvent.change(bodyTextarea, { target: { value: 'Dear team' } })
    bodyTextarea.focus()
    bodyTextarea.setSelectionRange(5, 5)
    fireEvent.select(bodyTextarea)

    fireEvent.click(screen.getByRole('button', { name: 'Insert Variable (Body)' }))
    fireEvent.click(screen.getByRole('button', { name: '{{contact_name}}' }))
    expect(bodyTextarea).toHaveValue('Dear {{contact_name}}team')
  })

  it('renders markdown preview for body tab', () => {
    render(
      <TemplateForm
        mode="create"
        isSubmitting={false}
        errorMessage={null}
        onCancel={() => undefined}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />,
    )

    const bodyTextarea = screen.getByLabelText('Body (Markdown)')
    fireEvent.change(bodyTextarea, { target: { value: '# Markdown Title' } })
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))

    expect(screen.getByRole('heading', { name: 'Markdown Title' })).toBeInTheDocument()
  })
})
