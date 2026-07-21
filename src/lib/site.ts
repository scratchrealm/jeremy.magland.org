export const SITE_TITLE = 'Jeremy Magland'

export const SITE_DESCRIPTION =
  'Jeremy Magland — Data Scientist at the Flatiron Institute. ' +
  'Computational methods and open-source software for scientific data analysis.'

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
