import { EntityManager, EntityField } from '@/components/entity-manager'
import { Product } from '@/types'

const fields: EntityField<Product>[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price', type: 'number' },
  { key: 'gst', label: 'GST %', type: 'number' },
  { key: 'sku', label: 'SKU' },
  { key: 'description', label: 'Description' },
  { key: 'image', label: 'Image URL', list: false },
]

const defaults: Product = {
  id: '',
  name: '',
  category: '',
  price: 0,
  gst: 18,
  description: '',
  image: '',
  sku: '',
  createdAt: '',
  updatedAt: '',
}

export function Products() {
  return (
    <EntityManager
      title="Products"
      description="Manage your product catalog"
      endpoint="/products"
      queryKey="products"
      addLabel="Add Product"
      fields={fields}
      defaults={defaults}
      searchKeys={['name', 'category', 'sku']}
      primaryKey="name"
      secondaryKey="category"
      amountKey="price"
    />
  )
}
