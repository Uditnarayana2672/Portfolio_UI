// Image rules shared by every public page.

/** Only full https images can load on a separate domain. Others are treated as missing. */
export function usableImage(url: unknown): string | null {
  return typeof url === 'string' && url.startsWith('https://') ? url : null
}

/** Insert a Cloudinary transformation. Other hosts are returned untouched. */
export function cld(url: string, transform: string): string {
  const marker = '/upload/'
  if (!url.includes('res.cloudinary.com') || !url.includes(marker)) return url
  const [head, ...rest] = url.split(marker)
  return `${head}${marker}${transform}/${rest.join(marker)}`
}

/** Responsive sizes for a consistent, smart-cropped card or banner. */
export function cropped(url: string, width: number, ratio: string): string {
  return cld(url, `f_auto,q_auto,c_fill,g_auto,ar_${ratio},w_${width}`)
}

export function croppedSrcset(url: string, widths: number[], ratio: string): string {
  return widths.map((w) => `${cropped(url, w, ratio)} ${w}w`).join(', ')
}

/** True-colour, never cropped: for screenshots, charts and diagrams. */
export function natural(url: string, width = 1600): string {
  return cld(url, `f_auto,q_auto,c_limit,w_${width}`)
}

/** Tiny blurred copy, used as a backdrop behind images of unusual shapes. */
export function blurredBackdrop(url: string): string {
  return cld(url, 'f_auto,q_auto:low,c_fill,w_60,e_blur:400')
}

/** Portrait: consistent shape centred on the face. */
export function portraitImage(url: string, width = 720): string {
  return cld(url, `f_auto,q_auto,c_fill,g_face,ar_4:5,w_${width}`)
}

export interface ImageCrop { x: number; y: number; width: number; height: number }

const fraction = (value: number) => Math.min(Math.max(value, 0), 1).toFixed(4)

/** Company photo: the area chosen in admin, or a smart crop when none was chosen. */
export function companyImage(url: string, crop: ImageCrop | null | undefined, width = 800): string {
  const fill = `f_auto,q_auto,c_fill,ar_5:4,w_${width}`
  if (!crop) return cld(url, `${fill},g_auto`)
  // The decimals matter: Cloudinary reads "1" as one pixel but "1.0000" as 100%.
  const area = `c_crop,x_${fraction(crop.x)},y_${fraction(crop.y)},w_${fraction(crop.width)},h_${fraction(crop.height)}`
  return cld(url, `${area}/${fill}`)
}

/** Company logo: never cropped, and transparency is kept. */
export function companyLogo(url: string, width = 240): string {
  return cld(url, `f_auto,q_auto,c_limit,w_${width}`)
}
