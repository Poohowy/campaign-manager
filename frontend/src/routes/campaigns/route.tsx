import { AppShell } from '../../components/layout/AppShell'
import { CampaignDetailsPage } from './details-view'
import { CampaignsPage } from './view'

export function CampaignsRoute() {
  return (
    <AppShell>
      <CampaignsPage />
    </AppShell>
  )
}

export function CampaignDetailsRoute() {
  return (
    <AppShell>
      <CampaignDetailsPage />
    </AppShell>
  )
}
