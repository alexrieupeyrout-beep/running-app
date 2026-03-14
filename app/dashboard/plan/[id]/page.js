export const revalidate = 0

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import PlanDetailClient from './PlanDetailClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export default async function PlanDetailPage({ params }) {
  const { id } = await params
  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', id)
    .single()

  if (!plan) return notFound()

  return <PlanDetailClient plan={plan} />
}
