export function productDTO(p) {
  const precioCompra = Number(p.precio_compra) || 0
  const precioVenta = Number(p.precio_venta) || 0
  const existencia = Number(p.existencia) || 0
  const stockMin = Number(p.stock_min) || 10
  const margen = precioVenta > 0 ? ((precioVenta - precioCompra) / precioVenta) * 100 : 0
  const estado = existencia <= 0 ? 'agotado' : existencia < stockMin ? 'bajo' : 'ok'

  return {
    id: p.id,
    sku: p.sku || '',
    codigo_barras: p.codigo_barras || '',
    nombre: p.nombre,
    categoria: p.categoria || '',
    precio_compra: precioCompra,
    precio_venta: precioVenta,
    existencia,
    stock_min: stockMin,
    margen: Math.round(margen * 10) / 10,
    estado,
    proveedor_id: p.proveedor_id ?? undefined,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }
}

export function supplierDTO(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    contacto: row.contacto || '',
    telefono: row.telefono || '',
    email: row.email || '',
    direccion: row.direccion || '',
  }
}