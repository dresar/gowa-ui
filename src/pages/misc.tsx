import { BellRing, PhoneOff } from 'lucide-react'
import { ActionCard } from '@/components/shared/action-card'
import { PageHeader } from '@/components/shared/page-header'
import { CallRejectForm } from '@/features/call/call-reject-form'
import { NewsletterList } from '@/features/newsletter/newsletter-list'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'

export default function MiscPage() {
  const device = useSelectedDevice()

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <PageHeader
        title="Saluran & Panggilan"
        description="Langganan saluran dan perutean panggilan."
      />

      {!device ? (
        <DeviceGuard />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <ActionCard
            icon={BellRing}
            title="Siaran Saluran"
            description="Newsletter dan pembaruan publik yang diikuti perangkat ini."
          >
            <NewsletterList />
          </ActionCard>
          <ActionCard
            icon={PhoneOff}
            title="Tolak Panggilan Masuk"
            description="Tolak panggilan suara atau video menggunakan JID pemanggil dan Call ID dari webhook."
          >
            <CallRejectForm />
          </ActionCard>
        </div>
      )}
    </div>
  )
}
