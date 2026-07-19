import { useState } from 'react'
import { Alert } from '../../components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Spinner } from '../../components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { useAuth } from '../../features/auth/hooks/useAuth'
import {
  createTemplate,
  deleteTemplate,
  TemplatesApiError,
  updateTemplate,
} from '../../features/templates/api/template-client'
import { TemplateForm, type TemplateFormValues } from '../../features/templates/components/template-form'
import { useTemplatesQuery } from '../../features/templates/hooks/useTemplatesQuery'
import type { Template } from '../../features/templates/types/template'

function formatLastUpdated(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '-'
  }
  return parsed.toLocaleString()
}

export function TemplatesPage() {
  const templatesQuery = useTemplatesQuery()
  const { session } = useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [templatePendingDelete, setTemplatePendingDelete] = useState<Template | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const templates = templatesQuery.data?.data ?? []

  const openCreateDialog = () => {
    setEditingTemplate(null)
    setFormError(null)
    setPageError(null)
    setSuccessMessage(null)
    setIsFormOpen(true)
  }

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template)
    setFormError(null)
    setPageError(null)
    setSuccessMessage(null)
    setIsFormOpen(true)
  }

  const closeFormDialog = () => {
    if (isSubmitting) {
      return
    }
    setIsFormOpen(false)
    setEditingTemplate(null)
    setFormError(null)
  }

  const handleFormSubmit = async (values: TemplateFormValues) => {
    if (!session?.access_token) {
      setFormError('You must be authenticated to manage templates.')
      return
    }

    setFormError(null)
    setPageError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)
    try {
      if (editingTemplate) {
        await updateTemplate(session.access_token, editingTemplate.id, values)
        setSuccessMessage('Template updated successfully.')
      } else {
        await createTemplate(session.access_token, values)
        setSuccessMessage('Template created successfully.')
      }
      setIsFormOpen(false)
      setEditingTemplate(null)
      await templatesQuery.refetch()
    } catch (error) {
      if (error instanceof TemplatesApiError) {
        setFormError(error.message)
      } else {
        setFormError('Unable to save template.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDeleteDialog = (template: Template) => {
    setTemplatePendingDelete(template)
    setPageError(null)
    setSuccessMessage(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteTemplate = async () => {
    if (!templatePendingDelete) {
      return
    }

    if (!session?.access_token) {
      setPageError('You must be authenticated to delete templates.')
      return
    }

    setIsDeleting(true)
    setPageError(null)
    setSuccessMessage(null)
    try {
      await deleteTemplate(session.access_token, templatePendingDelete.id)
      setIsDeleteDialogOpen(false)
      setTemplatePendingDelete(null)
      setSuccessMessage('Template deleted successfully.')
      await templatesQuery.refetch()
    } catch (error) {
      if (error instanceof TemplatesApiError) {
        setPageError(error.message)
      } else {
        setPageError('Unable to delete template.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  if (templatesQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-6 text-sm text-slate-600">
          <Spinner />
          Loading templates...
        </CardContent>
      </Card>
    )
  }

  if (templatesQuery.isError) {
    return (
      <Alert variant="destructive">
        {templatesQuery.error instanceof Error
          ? templatesQuery.error.message
          : 'Unexpected error while loading templates.'}
      </Alert>
    )
  }

  const dialogTitle = editingTemplate ? 'Edit Template' : 'Create Template'
  const formInitialValues = editingTemplate
    ? {
        name: editingTemplate.name ?? '',
        subject: editingTemplate.subject ?? '',
        body_markdown: editingTemplate.body_markdown ?? '',
      }
    : undefined

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Create and manage reusable email templates.</CardDescription>
          </div>
          <Button onClick={openCreateDialog}>Create Template</Button>
        </CardHeader>
        <CardContent>
          {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}
          {pageError ? <Alert variant="destructive">{pageError}</Alert> : null}

          {templates.length === 0 ? (
            <p className="text-sm text-slate-600">No templates yet. Create your first template.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-44">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>{template.name ?? '-'}</TableCell>
                    <TableCell>{template.subject ?? '-'}</TableCell>
                    <TableCell>{formatLastUpdated(template.updated_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(template)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openDeleteDialog(template)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isFormOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeFormDialog} />
          <Card className="relative z-50 w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{dialogTitle}</CardTitle>
              <CardDescription>
                {editingTemplate
                  ? 'Update the template fields and save your changes.'
                  : 'Provide the required fields to create a new template.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateForm
                mode={editingTemplate ? 'edit' : 'create'}
                initialValues={formInitialValues}
                isSubmitting={isSubmitting}
                errorMessage={formError}
                onCancel={closeFormDialog}
                onSubmit={handleFormSubmit}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete template "{templatePendingDelete?.name ?? 'Untitled'}"?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault()
                void handleDeleteTemplate()
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
