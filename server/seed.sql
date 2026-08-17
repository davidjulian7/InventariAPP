-- ============================================================
-- RetailOS - Datos semilla (dev)
-- ============================================================

insert into stores (id, nombre, direccion, telefono, email) values
  (1, 'Abarrotes El Roble', 'Calle Principal 45, Col. Centro, CDMX 06000', '55-1234-5678', 'contacto@elroble.mx');

insert into store_settings (store_id, ticket_encabezado, ticket_pie, billing_email, billing_tarjeta, billing_proxima_cobro) values
  (1, 'ABARROTES EL ROBLE\nCalle Principal 45, CDMX', 'Gracias por su compra', 'facturacion@elroble.mx', '•••• 4242', date('now', 'start of month', '+1 month'));

insert into categories (id, nombre, color, store_id) values
  (1, 'Bebidas',   '#0EA5E9', 1),
  (2, 'Lácteos',   '#F59E0B', 1),
  (3, 'Botanas',   '#EF4444', 1),
  (4, 'Abarrotes', '#628141', 1),
  (5, 'Limpieza',  '#8B5CF6', 1);

insert into suppliers (id, nombre, contacto, telefono, email, direccion, store_id) values
  (1, 'Coca-Cola FEMSA', 'Carlos López', '55-1111-2222', 'carlos@cocacola.com', 'Av. Industriales 100, CDMX', 1),
  (2, 'Grupo Lala',      'Ana Pérez',    '55-3333-4444', 'ana@lala.mx',        'Blvd. Norte 200, CDMX',   1),
  (3, 'Bimbo S.A.',      'Pedro García', '55-5555-6666', 'pedro@bimbo.com',    'Calz. Vallejo 300, CDMX', 1);

insert into products (id, sku, codigo_barras, nombre, categoria, category_id, precio_compra, precio_venta, existencia, stock_min, proveedor_id, store_id) values
  (1, 'COCA-600',   '7501055300231', 'Coca-Cola 600ml',   'Bebidas',   1, 12.50, 20.00, 48, 20, 1, 1),
  (2, 'LELE-1L',    '7500478000014', 'Leche Lala 1L',     'Lácteos',   2, 19.00, 24.00, 12, 15, 2, 1),
  (3, 'SABR-45',    '7501011008084', 'Sabritas Original 45g', 'Botanas', 3, 10.50, 15.00, 0, 10, 3, 1),
  (4, 'CIEL-600',   '7501055328037', 'Agua Ciel 600ml',   'Bebidas',   1,  9.00, 12.00, 72, 30, 1, 1),
  (5, 'ARROZ-1KG',  '7500462010012', 'Arroz La Merced 1kg', 'Abarrotes', 4, 22.00, 30.00, 8, 12, 3, 1),
  (6, 'QUES-400',   '7501023011014', 'Queso Oaxaca 400g', 'Lácteos',   2, 45.00, 65.00, 15, 10, 2, 1),
  (7, 'ARIE-1KG',   '7501031305059', 'Detergente Ariel 1kg', 'Limpieza', 5, 55.00, 75.00, 3, 8, 3, 1),
  (8, 'JUGO-1L',    '7501003020024', 'Jugo del Valle 1L', 'Bebidas',   1, 18.00, 25.00, 34, 20, 1, 1);

insert into inventory_movements (producto_id, tipo, cantidad, motivo, store_id) values
  (1, 'entrada', 50, 'Compra a proveedor', 1),
  (2, 'salida',   5, 'Venta',              1),
  (3, 'ajuste',  -3, 'Merma',              1);

insert into sales (id, folio, cliente, subtotal, iva, total, metodo_pago, store_id) values
  (1, 'V-0001', 'Cliente general', 109.91, 17.59, 127.50, 'efectivo',      1),
  (2, 'V-0002', 'Cliente general', 297.41, 47.59, 345.00, 'transferencia', 1),
  (3, 'V-0003', 'Cliente general',  76.72, 12.28,  89.00, 'efectivo',      1),
  (4, 'V-0004', 'Cliente general', 1068.97, 171.03, 1240.00, 'terminal',   1),
  (5, 'V-0005', 'Cliente general',  48.71,  7.79,  56.50, 'efectivo',      1);

insert into sale_items (venta_id, producto_id, nombre, precio, qty, subtotal) values
  (1, 1, 'Coca-Cola 600ml', 20.00, 3, 60.00),
  (1, 4, 'Agua Ciel 600ml', 12.00, 2, 24.00),
  (2, 2, 'Leche Lala 1L',   24.00, 5, 120.00),
  (2, 6, 'Queso Oaxaca 400g', 65.00, 2, 130.00),
  (3, 1, 'Coca-Cola 600ml', 20.00, 2, 40.00),
  (4, 6, 'Queso Oaxaca 400g', 65.00, 6, 390.00),
  (5, 4, 'Agua Ciel 600ml', 12.00, 3, 36.00);
