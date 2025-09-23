import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["search", "grid", "cart", "cartList", "total", "categoryCheckbox"]

  connect() {
    this.items = [] // {id, name, price, qty}
    this.updateTotal()
  }

  filter() {
    this.applyFilters()
  }

  // 複数カテゴリのチェックボックス変更時に呼ばれる
  filterByCategories(event) {
    // 「全て」を選択した場合は他を外す／他を選択した場合は「全て」を外す
    if (event && event.currentTarget) {
      const changed = event.currentTarget
      const category = changed.dataset.category
      if (category === "all" && changed.checked) {
        this.categoryCheckboxTargets.forEach(cb => {
          if (cb !== changed) cb.checked = false
        })
      } else if (category !== "all" && changed.checked) {
        const allCb = this.categoryCheckboxTargets.find(cb => cb.dataset.category === "all")
        if (allCb) allCb.checked = false
      }
    }
    this.applyFilters()
  }

  applyFilters() {
    const searchQuery = (this.searchTarget.value || "").toLowerCase()

    // 選択されているカテゴリの配列（"all" は除外）
    const checked = this.categoryCheckboxTargets.filter(cb => cb.checked)
    const isAllChecked = checked.some(cb => cb.dataset.category === "all")
    const selectedCategories = checked
      .filter(cb => cb.dataset.category !== "all")
      .map(cb => cb.dataset.category)

    const noCategoryFilter = isAllChecked || selectedCategories.length === 0

    this.gridTarget.querySelectorAll('.card').forEach(card => {
      const name = (card.dataset.name || "").toLowerCase()
      const category = card.dataset.category || ""

      const matchesSearch = name.includes(searchQuery)
      const matchesCategory = noCategoryFilter || selectedCategories.includes(category)

      card.style.display = (matchesSearch && matchesCategory) ? "" : "none"
    })
  }

  clear() {
    this.searchTarget.value = ""
    // カテゴリは「全て」をオン、他はオフ
    const allCb = this.categoryCheckboxTargets.find(cb => cb.dataset.category === "all")
    if (allCb) allCb.checked = true
    this.categoryCheckboxTargets.forEach(cb => {
      if (cb.dataset.category !== "all") cb.checked = false
    })
    this.applyFilters()
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
    // テーブルtbodyをクリア
    if (this.hasCartTarget) this.cartTarget.innerHTML = ''
    // モバイルリストをクリア
    if (this.hasCartListTarget) this.cartListTarget.innerHTML = ''

    if (this.items.length === 0) {
      if (this.hasCartTarget) {
        const tr = document.createElement('tr')
        tr.className = 'text-muted'
        tr.innerHTML = '<td colspan="6">商品が追加されていません</td>'
        this.cartTarget.appendChild(tr)
      }
      if (this.hasCartListTarget) {
        const li = document.createElement('div')
        li.className = 'list-group-item text-muted'
        li.textContent = '商品が追加されていません'
        this.cartListTarget.appendChild(li)
      }
      this.updateTotal()
      return
    }

    // テーブル行の描画
    if (this.hasCartTarget) {
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
    }

    // モバイルカードの描画
    if (this.hasCartListTarget) {
      this.items.forEach(item => {
        const subtotal = item.price * item.qty
        const div = document.createElement('div')
        div.className = 'list-group-item'
        div.innerHTML = `
          <div class="d-flex w-100 justify-content-between align-items-center mb-1">
            <strong>${this.escape(item.name)}</strong>
            <button class="btn btn-sm btn-outline-danger" data-action="click->icon-calculator#remove" data-id="${item.id}"><i class="fas fa-trash"></i></button>
          </div>
          <div class="d-flex align-items-center justify-content-between gap-2">
            <div class="text-success">単価: ¥${this.format(item.price)}</div>
            <div class="flex-grow-1 d-flex align-items-center gap-2">
              <label class="small text-muted">数量</label>
              <input type="number" class="form-control form-control-sm" min="1" value="${item.qty}" data-action="change->icon-calculator#changeQty" data-id="${item.id}">
            </div>
            <div class="fw-bold">小計: ¥${this.format(subtotal)}</div>
          </div>
        `
        this.cartListTarget.appendChild(div)
      })
    }

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
