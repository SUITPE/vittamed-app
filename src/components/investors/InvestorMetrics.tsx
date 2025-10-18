import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface MetricProps {
  label: string
  value: string
  className?: string
}

export function InvestorMetric({ label, value, className }: MetricProps) {
  return (
    <div className={cn('text-center', className)}>
      <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}

interface InvestorMetricsCardProps {
  stats: { label: string; value: string }[]
  className?: string
}

export function InvestorMetricsCard({ stats, className }: InvestorMetricsCardProps) {
  return (
    <Card className={cn('border-[#40C9C6]/20', className)}>
      <CardContent className="p-6">
        <div
          className={cn(
            'grid gap-6',
            stats.length === 2 && 'grid-cols-2',
            stats.length === 3 && 'grid-cols-3',
            stats.length === 4 && 'grid-cols-2 sm:grid-cols-4'
          )}
        >
          {stats.map((stat, index) => (
            <InvestorMetric key={index} label={stat.label} value={stat.value} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
