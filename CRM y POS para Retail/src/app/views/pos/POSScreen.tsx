import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Search, ShoppingCart, CheckCircle, Scan, Package2, Banknote, Smartphone, CreditCard, X, MessageCircle, Mail, Download, RefreshCw } from 'lucide-react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'
import { BottomSheet } from '../../components/shared/BottomSheet'
import { Btn } from '../../components/shared/Button'
import { Badge } from '../../components/shared/Badge'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { ProductService } from '../../services/product.service'
import { SaleService } from '../../services/sale.service'
import type { Product } from '../../types'

const CART_PRODUCT_FIELDS = ['id', 'codigo', 'nombre', 'precio', 'categoria'] as const

function toCartProduct(p: Product) {
  return { id: p.id, codigo: p.codigo_barras, nombre: p.nombre, precio: p.precio_venta, categoria: p.categoria }
}

function CartItems({ cart, updateQty, empty }: { cart: any[]; updateQty: (id: number, q: number) => void; empty: boolean }) {
  if (empty) return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <ShoppingCart size={36} className="mb-3 opacity-20" />
      <p className="text-sm font-medium">Carrito vacio</p>
      <p className="text-xs opacity-60">Toca un producto para agregarlo</p>
    </div>
  )
  return (
    <>
      {cart.map(item => (
        <div key={item.id} className="flex items-center gap-3 bg-muted rounded-xl px-3 py-3 min-h-[60px]">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-foreground truncate">{item.nombre}</div>
            <div className="text-xs text-primary font-semibold">${item.precio.toFixed(2)} c/u</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => updateQty(item.id, item.qty - 1)}
              className="w-8 h-8 rounded-xl bg-card border border-border text-foreground flex items-center justify-center font-bold cursor-pointer text-base min-w-[32px]">-</button>
            <span className="w-6 text-center text-sm font-bold text-foreground">{item.qty}</span>
            <button onClick={() => updateQty(item.id, item.qty + 1)}
              className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold cursor-pointer text-base min-w-[32px]">+</button>
          </div>
          <div className="text-sm font-bold text-foreground w-16 text-right shrink-0">${(item.precio * item.qty).toFixed(2)}</div>
        </div>
      ))}
    </>
  )
}

function TotalsView({ subtotal, iva, total }: { subtotal: number; iva: number; total: number }) {
  return (
    <div className="px-4 pt-3 pb-1 border-t border-border/50 space-y-1.5 bg-muted/30">
      <div className="flex justify-between text-xs text-muted-foreground"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
      <div className="flex justify-between text-xs text-muted-foreground"><span>IVA 16%</span><span>${iva.toFixed(2)}</span></div>
      <div className="flex justify-between font-bold text-base text-foreground pt-1.5 border-t border-border/50">
        <span>Total</span><span className="text-primary">${total.toFixed(2)}</span>
      </div>
    </div>
  )
}

function PaymentPanel({ method, setMethod, cashAmount, setCashAmount, total, cart, onPay }: {
  method: string; setMethod: (m: string) => void; cashAmount: string; setCashAmount: (v: string) => void;
  total: number; cart: any[]; onPay: () => void
}) {
  const cashVal = parseFloat(cashAmount) || 0
  const change = cashVal - total
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-foreground text-sm">Metodo de pago</h3>
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 'efectivo', label: 'Efectivo', icon: Banknote },
          { id: 'transferencia', label: 'Transfer.', icon: Smartphone },
          { id: 'terminal', label: 'Terminal', icon: CreditCard }
        ].map(m => (
          <button key={m.id} onClick={() => setMethod(m.id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer min-h-[64px] transition-all ${method === m.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
            <m.icon size={18} />{m.label}
          </button>
        ))}
      </div>
      {method === 'efectivo' && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Efectivo recibido</label>
          <input type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} placeholder="0.00"
            className="w-full mt-1.5 px-3 py-3 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px]" />
          {cashAmount && change >= 0 && (
            <div className="mt-2 flex justify-between items-center bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
              <span className="text-sm text-green-700 font-medium">Cambio</span>
              <span className="text-green-700 font-bold text-base">${change.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
      <button onClick={onPay} disabled={cart.length === 0}
        className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-secondary transition-colors disabled:opacity-40 cursor-pointer text-sm min-h-[56px]">
        Cobrar ${total.toFixed(2)}
      </button>
    </div>
  )
}

function TicketPanel({ cart, subtotal, iva, total, folio, onNewSale }: {
  cart: any[]; subtotal: number; iva: number; total: number; folio: string; onNewSale: () => void
}) {
  const [dateStr] = useState(new Date().toLocaleString('es-MX'))
  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center"><CheckCircle size={18} className="text-green-600" /></div>
        <div><div className="font-bold text-foreground text-sm">Venta completada</div><div className="text-xs text-muted-foreground">Ticket {folio}</div></div>
      </div>
      <div className="bg-muted rounded-xl p-4 flex-1 overflow-y-auto font-mono text-xs text-foreground">
        <div className="text-center mb-3">
          <div className="font-bold text-sm">Abarrotes El Robble</div>
          <div className="text-muted-foreground">Calle Principal 45, CDMX</div>
          <div className="text-muted-foreground">{dateStr}</div>
        </div>
        <div className="border-t border-dashed border-border my-2" />
        {cart.map(item => (
          <div key={item.id} className="flex justify-between py-0.5">
            <span className="truncate mr-2">{item.nombre} x{item.qty}</span>
            <span className="shrink-0">${(item.precio * item.qty).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-dashed border-border my-2" />
        <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>IVA 16%</span><span>${iva.toFixed(2)}</span></div>
        <div className="flex justify-between font-bold border-t border-dashed border-border mt-1 pt-1"><span>TOTAL</span><span>${total.toFixed(2)}</span></div>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <Btn variant="primary" className="w-full min-h-[48px]"><MessageCircle size={15} />WhatsApp</Btn>
        <Btn variant="outline" className="w-full min-h-[48px]"><Mail size={15} />Correo</Btn>
        <Btn variant="outline" className="w-full min-h-[48px]"><Download size={15} />PDF</Btn>
        <Btn variant="secondary" onClick={onNewSale} className="w-full min-h-[48px]">Nueva venta</Btn>
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-card border border-border/50 rounded-2xl p-3.5 animate-pulse">
          <div className="w-9 h-9 bg-muted rounded-xl mb-2.5" />
          <div className="h-3 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function POSScreen() {
  const { isMobile, isTablet } = useBreakpoint()
  const { user } = useAuth()
  const { cart, addToCart, updateQty, clearCart, subtotal, iva, total, totalItems, isEmpty } = useCart()
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [cashAmount, setCashAmount] = useState('')
  const [showTicket, setShowTicket] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [showCart, setShowCart] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [lastFolio, setLastFolio] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setLoadError(false)
        const data = await ProductService.getAll(1)
        if (!cancelled) setProducts(data)
      } catch {
        if (!cancelled) {
          setLoadError(true)
          toast.error('Error al cargar productos')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const categories = ['Todos', ...new Set(products.map(p => p.categoria).filter(Boolean))]

  const cartProducts = products.map(toCartProduct)

  const { scanning, error: scanError, videoRef, startScanning, stopScanning } = useBarcodeScanner({
    onDetect: (barcode: string) => {
      const product = products.find(p => p.codigo_barras === barcode)
      if (product) addToCart(toCartProduct(product))
      setShowScanner(false)
    },
  })

  useEffect(() => {
    if (scanError) toast.error(scanError)
  }, [scanError])

  const filtered = cartProducts.filter(p => {
    const ms = p.nombre.toLowerCase().includes(search.toLowerCase()) || p.codigo.includes(search)
    const mc = activeCategory === 'Todos' || p.categoria === activeCategory
    return ms && mc
  })

  const paySale = async () => {
    if (paymentMethod === 'efectivo' && !cashAmount) return
    try {
      const sale = await SaleService.create(cart, paymentMethod, user?.store_id ?? 1, user?.id ?? 0)
      setLastFolio(sale.folio)
      setShowTicket(true)
      setShowPayment(false)
      toast.success('Venta registrada exitosamente')
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar la venta')
    }
  }

  const newSale = () => {
    clearCart()
    setShowTicket(false)
    setLastFolio('')
    setCashAmount('')
    setShowCart(false)
    setShowPayment(false)
  }

  const retryLoad = () => {
    setLoading(true)
    setLoadError(false)
    ProductService.getAll(1).then(data => {
      setProducts(data)
      setLoading(false)
    }).catch(() => {
      setLoadError(true)
      setLoading(false)
      toast.error('Error al cargar productos')
    })
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-12 bg-muted rounded-xl animate-pulse" />
        <div className="h-8 bg-muted rounded-xl animate-pulse w-1/2" />
        <SkeletonGrid />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground mb-4">No se pudieron cargar los productos</p>
        <button onClick={retryLoad} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold cursor-pointer min-h-[44px]">
          <RefreshCw size={15} />Reintentar
        </button>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 64px)' }}>
        <div className="px-0 py-2 bg-card border-b border-border/50 flex gap-2 shrink-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto o codigo..."
              className="w-full pl-8 pr-3 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px]" />
          </div>
          <button onClick={() => setShowScanner(true)} className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center cursor-pointer shrink-0"><Scan size={20} /></button>
        </div>
        <div className="py-2 border-b border-border/30 shrink-0 overflow-x-auto flex gap-2">
          {categories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)}
              className={`px-3 py-2 text-xs rounded-xl font-semibold whitespace-nowrap cursor-pointer shrink-0 min-h-[36px] transition-colors ${c === activeCategory ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{c}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(p => (
              <button key={p.id} onClick={() => addToCart(p)}
                className="bg-card border border-border/50 rounded-2xl p-3.5 text-left active:scale-[0.97] transition-all cursor-pointer min-h-[100px]">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center mb-2.5"><Package2 size={16} className="text-primary" /></div>
                <div className="text-xs font-bold text-foreground leading-snug mb-1">{p.nombre}</div>
                <div className="text-primary font-bold text-base">${p.precio.toFixed(2)}</div>
              </button>
            ))}
          </div>
          {filtered.length === 0 && search && (
            <div className="text-center text-muted-foreground text-sm py-8">Sin resultados para "{search}"</div>
          )}
        </div>
        <div className="py-3 bg-card border-t border-border shadow-lg shrink-0">
          {showTicket ? (
            <button onClick={newSale} className="w-full py-3.5 bg-secondary/20 text-primary font-bold rounded-xl cursor-pointer text-sm min-h-[52px]">
              Venta completada - Nueva venta
            </button>
          ) : (
            <button onClick={() => cart.length > 0 && setShowCart(true)} disabled={cart.length === 0}
              className="w-full py-3.5 bg-primary text-white font-bold rounded-xl cursor-pointer disabled:opacity-40 flex items-center justify-between px-5 min-h-[56px] hover:bg-secondary transition-colors">
              <div className="flex items-center gap-2"><ShoppingCart size={18} /><span>{totalItems > 0 ? totalItems + ' producto' + (totalItems > 1 ? 's' : '') : 'Carrito vacio'}</span></div>
              <span className="text-lg font-black">${total.toFixed(2)}</span>
            </button>
          )}
        </div>

        <BottomSheet isOpen={showCart} onClose={() => setShowCart(false)} title="Carrito de venta" fullHeight>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <CartItems cart={cart} updateQty={updateQty} empty={isEmpty} />
            </div>
            {!isEmpty && (
              <>
                <TotalsView subtotal={subtotal} iva={iva} total={total} />
                <div className="px-4 pb-6 pt-3">
                  <button onClick={() => { setShowCart(false); setShowPayment(true); }}
                    className="w-full py-4 bg-primary text-white font-bold rounded-xl text-sm cursor-pointer hover:bg-secondary transition-colors min-h-[56px]">
                    Continuar al pago
                  </button>
                </div>
              </>
            )}
          </div>
        </BottomSheet>

        <BottomSheet isOpen={showPayment} onClose={() => setShowPayment(false)} title="Metodo de pago" fullHeight>
          <div className="p-4">
            <div className="bg-muted rounded-xl px-4 py-3 mb-4 flex justify-between items-center">
              <div><div className="text-xs text-muted-foreground">{totalItems} productos</div><div className="text-lg font-bold text-foreground">Total: ${total.toFixed(2)}</div></div>
              <button onClick={() => { setShowPayment(false); setShowCart(true); }} className="text-xs text-primary font-semibold cursor-pointer">Editar carrito</button>
            </div>
            {showTicket ? (
              <TicketPanel cart={cart} subtotal={subtotal} iva={iva} total={total} folio={lastFolio} onNewSale={newSale} />
            ) : (
              <PaymentPanel method={paymentMethod} setMethod={setPaymentMethod} cashAmount={cashAmount} setCashAmount={setCashAmount} total={total} cart={cart} onPay={paySale} />
            )}
          </div>
        </BottomSheet>

        <BottomSheet isOpen={showScanner} onClose={() => { stopScanning(); setShowScanner(false); }} title="Escanear codigo" fullHeight>
          <div className="p-4">
            <div className="bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative">
              {scanning ? (
                <video ref={videoRef} className="w-full h-full object-cover" />
              ) : (
                <button onClick={startScanning} className="flex flex-col items-center gap-2 text-white cursor-pointer">
                  <Scan size={40} className="opacity-50" />
                  <span className="text-sm opacity-70">Toca para iniciar escaneo</span>
                </button>
              )}
            </div>
          </div>
        </BottomSheet>

        <ConfirmDialog
          open={showClearConfirm}
          onOpenChange={setShowClearConfirm}
          onConfirm={() => { clearCart(); setShowClearConfirm(false) }}
          title="Limpiar carrito"
          description="¿Estas seguro de vaciar el carrito? Se perderan todos los productos agregados."
          confirmText="Limpiar"
          destructive
        />
      </div>
    )
  }

  return (
    <div className={`flex gap-4 pb-4 ${isTablet ? 'h-[calc(100vh-128px)]' : 'h-[calc(100vh-112px)]'}`}>
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o codigo de barras..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>
          <Btn variant="outline" size="md" onClick={() => setShowScanner(true)}><Scan size={15} />Escanear</Btn>
        </div>
        <div className="flex-1 bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex gap-1.5 flex-wrap">
              {categories.map(c => (
                <button key={c} onClick={() => setActiveCategory(c)}
                  className={`px-3 py-1.5 text-xs rounded-xl font-medium cursor-pointer transition-all ${c === activeCategory ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}>{c}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className={`grid gap-3 ${isTablet ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {filtered.map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="bg-background hover:bg-primary/8 border border-border/50 hover:border-primary/30 rounded-xl p-3 text-left transition-all cursor-pointer group">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center mb-2.5 group-hover:bg-primary/20"><Package2 size={16} className="text-primary" /></div>
                  <div className="text-xs font-bold text-foreground leading-snug mb-1">{p.nombre}</div>
                  <div className="text-primary font-bold text-sm">${p.precio.toFixed(2)}</div>
                  <div className="text-muted-foreground text-xs mt-0.5">{p.categoria}</div>
                </button>
              ))}
            </div>
            {filtered.length === 0 && search && (
              <div className="text-center text-muted-foreground text-sm py-8">Sin resultados para "{search}"</div>
            )}
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
          <h3 className="font-bold text-foreground text-sm mb-3">Historial del dia</h3>
          <div className="space-y-2">
            <div className="text-center text-xs text-muted-foreground py-4">No hay ventas registradas hoy</div>
          </div>
        </div>
      </div>

      <div className="w-72 flex flex-col gap-4 shrink-0">
        {showTicket ? (
          <div className="flex-1 bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <TicketPanel cart={cart} subtotal={subtotal} iva={iva} total={total} folio={lastFolio} onNewSale={newSale} />
          </div>
        ) : (
          <>
            <div className="flex-1 bg-card rounded-2xl border border-border/50 flex flex-col overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/50">
                <h3 className="font-bold text-foreground text-sm">Carrito</h3>
                {!isEmpty && <button onClick={() => setShowClearConfirm(true)} className="text-xs text-red-500 hover:underline cursor-pointer">Limpiar</button>}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <CartItems cart={cart} updateQty={updateQty} empty={isEmpty} />
              </div>
              {!isEmpty && <TotalsView subtotal={subtotal} iva={iva} total={total} />}
            </div>
            <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
              <PaymentPanel method={paymentMethod} setMethod={setPaymentMethod} cashAmount={cashAmount} setCashAmount={setCashAmount} total={total} cart={cart} onPay={paySale} />
            </div>
          </>
        )}
      </div>

      <BottomSheet isOpen={showScanner} onClose={() => { stopScanning(); setShowScanner(false); }} title="Escanear codigo" fullHeight>
        <div className="p-4">
          <div className="bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative">
            {scanning ? (
              <video ref={videoRef} className="w-full h-full object-cover" />
            ) : (
              <button onClick={startScanning} className="flex flex-col items-center gap-2 text-white cursor-pointer">
                <Scan size={40} className="opacity-50" />
                <span className="text-sm opacity-70">Toca para iniciar escaneo</span>
              </button>
            )}
          </div>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        onConfirm={() => { clearCart(); setShowClearConfirm(false) }}
        title="Limpiar carrito"
        description="¿Estas seguro de vaciar el carrito? Se perderan todos los productos agregados."
        confirmText="Limpiar"
        destructive
      />
    </div>
  )
}
