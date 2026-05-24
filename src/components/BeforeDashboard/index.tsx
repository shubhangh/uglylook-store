import React from 'react'
import { SeedButton } from './SeedButton'
import './index.scss'

const baseClass = 'before-dashboard'

export const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <h4>Store Dashboard</h4>
        <p>Manage products, orders, and content for UglyLook.</p>
      </div>
      <div className={`${baseClass}__links`}>
        <a href="/adm/collections/products">Products</a>
        <a href="/adm/collections/orders">Orders</a>
        <a href="/adm/collections/categories">Categories</a>
        <a href="/adm/collections/users">Customers</a>
        <a href="/adm/collections/posts">Reads</a>
        <a href="/adm/collections/media">Media</a>
        <a href="/" target="_blank" rel="noopener noreferrer">
          View Store
        </a>
      </div>
      <SeedButton />
    </div>
  )
}
