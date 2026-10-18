import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'

const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const serif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif',
  display: 'swap',
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${sans.variable} ${serif.variable} font-sans min-h-screen`}>
      <Component {...pageProps} />
    </div>
  )
}
