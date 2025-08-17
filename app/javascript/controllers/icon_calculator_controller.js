import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["search", "grid", "cart", "total"]

  connect() {
    this.items = [] // {id, name, price, qty}
    this.updateTotal()
  }

  filter() {
    const q = (this.searchTarget.value || "").toLowerCase()
    this.gridTarget.querySelectorAll('.card').forEach(card => {
      const name = (card.dataset.name || "").toLowerCase()
      card.style.display = name.includes(q) ? "" : "none"
    })
  }

  clear() {
    this.searchTarget.value = ""
    this.filter()
  }

  add(event) {
    const btn = event.currentTarget
    const id = parseInt(btn.dataset.id)
    const name = btn.dataset.name
    const price = parseFloat(btn.dataset.price)

    const existing = this.items.find(i => i.id === id)
    if (existing) {
      existing.qty += 1
    } else {
      this.items.push({ id, name, price, qty: 1 })
    }
    this.renderCart()
  }

  changeQty(event) {
    const id = parseInt(event.currentTarget.dataset.id)
    const qty = Math.max(1, parseInt(event.currentTarget.value || 1))
    const item = this.items.find(i => i.id === id)
    if (item) {
      item.qty = qty
      this.renderCart()
    }
  }

  remove(event) {
    const id = parseInt(event.currentTarget.dataset.id)
    this.items = this.items.filter(i => i.id !== id)
    this.renderCart()
  }

  clearCart() {
    this.items = []
    this.renderCart()
  }

  renderCart() {
    // tbodyクリア
    this.cartTarget.innerHTML = ''

    if (this.items.length === 0) {
      const tr = document.createElement('tr')
      tr.className = 'text-muted'
      tr.innerHTML = '<td colspan="6">商品が追加されていません</td>'
      this.cartTarget.appendChild(tr)
      this.updateTotal()
      return
    }

    this.items.forEach(item => {
      const subtotal = item.price * item.qty
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td><span class="badge bg-success">選択</span></td>
        <td>${this.escape(item.name)}</td>
        <td>¥${this.format(item.price)}</td>
        <td><input type="number" class="form-control form-control-sm" min="1" value="${item.qty}" data-action="change->icon-calculator#changeQty" data-id="${item.id}"></td>
        <td>¥${this.format(subtotal)}</td>
        <td><button class="btn btn-sm btn-outline-danger" data-action="click->icon-calculator#remove" data-id="${item.id}"><i class="fas fa-trash"></i></button></td>
      `
      this.cartTarget.appendChild(tr)
    })

    this.updateTotal()
  }

  updateTotal() {
    const total = this.items.reduce((acc, i) => acc + i.price * i.qty, 0)
    this.totalTarget.textContent = total.toLocaleString()
  }

  save(event) {
    event.preventDefault()
    // 簡易保存：ローカルストレージに保存（将来的にサーバ保存に切替可能）
    const payload = { items: this.items, savedAt: new Date().toISOString() }
    localStorage.setItem('iconCalculatorCart', JSON.stringify(payload))
    alert('選択内容を保存しました。')
  }

  async exportPdf(event) {
    event.preventDefault()
    // 動的に jsPDF を読み込み（CDN）。アプリに導入する場合は importmap/npm に追加を推奨
    if (!window.jspdf) {
      await this.loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js')
    }
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text('選択した商品', 10, 15)

    let y = 25
    doc.setFontSize(12)
    this.items.forEach((i, idx) => {
      doc.text(`${idx + 1}. ${i.name} / 単価: ¥${this.format(i.price)} / 数量: ${i.qty} / 小計: ¥${this.format(i.price * i.qty)}`, 10, y)
      y += 8
    })

    y += 5
    doc.setFontSize(14)
    const total = this.items.reduce((acc, i) => acc + i.price * i.qty, 0)
    doc.text(`合計: ¥${this.format(total)}`, 10, y)

    doc.save('選択商品一覧.pdf')
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = src
      s.onload = resolve
      s.onerror = reject
      document.head.appendChild(s)
    })
  }

  format(n) {
    return Math.round(n).toLocaleString()
  }

  escape(str) {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }
}
