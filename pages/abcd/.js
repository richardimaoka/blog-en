import { useCallback } from 'react'
import Link from 'next/link'

export default function Redirecting() {
  return(
    <Link href="/addddbcd">
      <a>without slash</a>
    </Link>
  )
}