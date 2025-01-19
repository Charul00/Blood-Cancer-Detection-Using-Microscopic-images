// src/components/ui/card.jsx
import React from "react"

const Card = React.forwardRef(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow ${className}`}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardContent = React.forwardRef(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`p-6 ${className}`} {...props} />
  )
)
CardContent.displayName = "CardContent"

export { Card, CardContent }