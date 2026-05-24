import React from 'react'

export const Logo = () => {
  return (
    <div className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/icon-dark.svg"
        alt="UglyLook icon"
        className="w-8 h-8 rounded-[5px]"
      />
      <span
        className="text-xl font-bold tracking-[-0.025em]"
        style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
      >
        UglyLook
      </span>
    </div>
  )
}
