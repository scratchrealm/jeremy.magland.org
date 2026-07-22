export const SITE_TITLE = 'Jeremy Magland'

export const SITE_DESCRIPTION =
  'Jeremy Magland — Data Scientist at the Flatiron Institute. ' +
  'Computational methods and open-source software for scientific data analysis.'

// GoatCounter site code — the subdomain of the goatcounter.com account that
// receives the pageviews (https://<code>.goatcounter.com). Set to '' to
// disable analytics entirely. Only loaded in production builds.
export const GOATCOUNTER_CODE = 'jeremy-magland'

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

const listFormatter = new Intl.ListFormat('en-US', {
  style: 'long',
  type: 'conjunction',
})

// "Ada" · "Ada and Grace" · "Ada, Grace, and Alan"
export function formatAuthors(authors: string[]): string {
  return listFormatter.format(authors)
}
