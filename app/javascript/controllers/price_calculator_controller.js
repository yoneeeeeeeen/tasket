import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "formTemplate", "productSelect", "quantityInput", "totalPrice", "itemTotal", 
    "searchInput", "categoryCheckboxes", "categoryCheckbox", "productList",
    "sortSelect", "resultCount", "advancedToggle", "selectedProductInfo", "selectedProductName"
  ]

  connect() {
    this.addChangeListeners()
    this.updateTotalPrice()
    this.setupCategoryFilters()
    this.setupModalFocusManagement()
    
    // 全商品データの取得（エラーハンドリング付き）
    try {
      this.allProducts = this.getAllProducts()
      this.updateResultCount()
    } catch (error) {
      console.error('Error getting all products:', error)
      this.allProducts = []
    }
  }

  addForm() {
    const template = this.formTemplateTarget.cloneNode(true)
    template.classList.remove("d-none") // 非表示クラスを削除
    this.element.querySelector("#forms-container").appendChild(template)

    // itemTotal要素がなければ追加
    let itemTotal = template.querySelector("[data-price-calculator-target='itemTotal']")
    if (!itemTotal) {
      itemTotal = document.createElement('span')
      itemTotal.setAttribute('data-price-calculator-target', 'itemTotal')
      itemTotal.textContent = "0"
      // 適切な場所に追加（例: quantityInputの後）
      const quantityInput = template.querySelector("[data-price-calculator-target='quantityInput']")
      if (quantityInput && quantityInput.parentNode) {
        quantityInput.parentNode.appendChild(itemTotal)
      } else {
        template.appendChild(itemTotal)
      }
    }

    // 新しいフォーム内の要素にイベントリスナーを追加
    const quantityInput = template.querySelector("[data-price-calculator-target='quantityInput']")
    if (quantityInput) {
      quantityInput.addEventListener("change", () => this.updateItemTotal(template))
    }

    // 合計金額を再計算
    this.updateTotalPrice()
  }

  removeForm(event) {
    const formGroup = event.target.closest(".form-group")
    const formsContainer = this.element.querySelector("#forms-container")

    // 一番上のフォームは削除できないようにする
    if (formsContainer.firstElementChild === formGroup) {
      alert("一番上のフォームは削除できません。")
      return
    }

    formGroup.remove()
    this.updateTotalPrice()
  }

  resetForms() {
    const formsContainer = this.element.querySelector("#forms-container")
    const firstForm = formsContainer.firstElementChild

    // 最初のフォーム以外を削除
    while (formsContainer.children.length > 1) {
      formsContainer.lastElementChild.remove()
    }

    // 最初のフォームを初期化
    firstForm.querySelector("[data-price-calculator-target='productSelect']").value = ""
    firstForm.querySelector("[data-price-calculator-target='quantityInput']").value = "1"
    firstForm.querySelector("[data-price-calculator-target='itemTotal']").textContent = "0"
    
    // 商品選択情報をリセット
    const selectedProductInfo = firstForm.querySelector("[data-price-calculator-target='selectedProductInfo']")
    const stockInfo = firstForm.querySelector("[data-stock-info]")
    const categoryInfo = firstForm.querySelector("[data-category-info]")
    
    if (selectedProductInfo) selectedProductInfo.style.display = 'none'
    if (stockInfo) stockInfo.textContent = '-'
    if (categoryInfo) categoryInfo.textContent = '-'

    // 合計金額をリセット
    this.totalPriceTarget.textContent = "0"
  }

  updateItemTotal(formGroup) {
    // formGroupの存在確認
    if (!formGroup) {
      console.error('formGroup is null or undefined')
      return
    }

    const select = formGroup.querySelector("[data-price-calculator-target='productSelect']")
    const input = formGroup.querySelector("[data-price-calculator-target='quantityInput']")
    let itemTotal = formGroup.querySelector("[data-price-calculator-target='itemTotal']")

    // 必要な要素の存在確認
    if (!select || !input) {
      console.error('Required elements not found:', { select, input, itemTotal })
      return
    }
    // itemTotalがなければ自動生成
    if (!itemTotal) {
      itemTotal = document.createElement('span')
      itemTotal.setAttribute('data-price-calculator-target', 'itemTotal')
      itemTotal.textContent = "0"
      // quantityInputの後ろに追加
      if (input && input.parentNode) {
        input.parentNode.appendChild(itemTotal)
      } else {
        formGroup.appendChild(itemTotal)
      }
    }

    // 商品の価格を取得
    const price = parseFloat(select.value) || 0
    const quantity = parseInt(input.value, 10) || 0
    const total = price * quantity

    // 小計を更新
    itemTotal.textContent = total.toLocaleString()
    // 合計金額を更新
    this.updateTotalPrice()

    // 在庫やカテゴリ情報を取得
    const stockInfo = formGroup.querySelector("[data-stock-info]")
    const categoryInfo = formGroup.querySelector("[data-category-info]")

    // 在庫・カテゴリ情報の存在確認
    if (stockInfo && categoryInfo) {
      let selectedOption = null;
      if (select.tagName === 'SELECT' && select.options && typeof select.selectedIndex === 'number' && select.selectedIndex >= 0) {
        selectedOption = select.options[select.selectedIndex] || null;
      }
      const stock = selectedOption && typeof selectedOption.getAttribute === 'function'
        ? selectedOption.getAttribute("data-stock")
        : select.getAttribute("data-stock") || "不明";
      const category = selectedOption && typeof selectedOption.getAttribute === 'function'
        ? selectedOption.getAttribute("data-category")
        : select.getAttribute("data-category") || "不明";

      stockInfo.textContent = stock
      categoryInfo.textContent = category
    }
  }

  updateTotalPrice() {
    let total = 0
    this.element.querySelectorAll("[data-price-calculator-target='itemTotal']").forEach((itemTotal) => {
      total += parseFloat(itemTotal.textContent.replace(/,/g, "")) || 0
    })
    this.totalPriceTarget.textContent = total.toLocaleString()
  }

  addChangeListeners() {
    // 既存のフォーム内の要素にイベントリスナーを追加
    this.productSelectTargets.forEach((select) => {
      select.addEventListener("change", (event) => this.updateItemTotal(event.target.closest(".form-group")))
    })
    this.quantityInputTargets.forEach((input) => {
      input.addEventListener("change", (event) => this.updateItemTotal(event.target.closest(".form-group")))
    })
  }

  openProductModal(event) {
    this.currentFormGroup = event.target.closest(".form-group")
    const modal = new bootstrap.Modal(document.getElementById("productModal"))
    const modalElement = document.getElementById("productModal")
    
    // モーダルが完全に開かれた後に検索フィールドにフォーカス
    modalElement.addEventListener('shown.bs.modal', () => {
      const searchInput = this.searchInputTarget
      if (searchInput) {
        searchInput.focus()
      }
    }, { once: true })
    
    modal.show()
  }

  selectProduct(event) {
    const button = event.currentTarget;
    const formGroup = button.closest('.form-group');
    
    // formGroupの存在確認とcurrentFormGroupの設定
    if (formGroup) {
      this.currentFormGroup = formGroup;
    } else if (!this.currentFormGroup) {
      console.error('No form group found and no current form group set')
      return
    }

    const productName = button.getAttribute("data-product-name")
    const productPrice = button.getAttribute("data-product-price")
    const productStock = button.getAttribute("data-product-stock")
    const productCategory = button.getAttribute("data-product-category")

    // 商品情報の存在確認
    if (!productName || !productPrice) {
      console.error('Required product data missing:', { productName, productPrice })
      return
    }

    // 現在のフォームに選択した商品情報を反映
    const productSelect = this.currentFormGroup.querySelector("[data-price-calculator-target='productSelect']")
    const stockInfo = this.currentFormGroup.querySelector("[data-stock-info]")
    const categoryInfo = this.currentFormGroup.querySelector("[data-category-info]")
    const productNameInfo = this.currentFormGroup.querySelector("[data-product-name]")
    const quantityInput = this.currentFormGroup.querySelector("[data-price-calculator-target='quantityInput']")
    const selectedProductInfo = this.currentFormGroup.querySelector("[data-price-calculator-target='selectedProductInfo']")
    const selectedProductName = this.currentFormGroup.querySelector("[data-price-calculator-target='selectedProductName']")

    // 必要な要素の存在確認
    if (!productSelect || !quantityInput) {
      console.error('Required form elements not found:', { productSelect, quantityInput })
      return
    }

    // 商品情報を設定
    productSelect.value = productPrice
    productSelect.setAttribute("data-stock", productStock || "0")
    productSelect.setAttribute("data-category", productCategory || "未分類")
    
    if (stockInfo) stockInfo.textContent = productStock || "不明"
    if (categoryInfo) categoryInfo.textContent = productCategory || "未分類"
    if (productNameInfo) productNameInfo.textContent = productName
    
    // 商品名を表示し、選択情報エリアを表示
    if (selectedProductName && selectedProductInfo) {
      selectedProductName.textContent = productName
      selectedProductInfo.style.display = 'block'
    }

    // ボタンからフォーカスを外してからモーダルを閉じる
    button.blur()
    
    // モーダルインスタンスの取得
    const modalElement = document.getElementById("productModal")
    const modal = bootstrap.Modal.getInstance(modalElement)
    
    if (!modal) {
      console.error('Modal instance not found')
      return
    }
    
    // 即座に小計を更新（モーダル閉鎖前）
    this.updateItemTotal(this.currentFormGroup)
    
    // モーダルが完全に閉じられた後の処理
    const handleModalHidden = (event) => {
      // イベントリスナーを削除（重複防止）
      modalElement.removeEventListener('hidden.bs.modal', handleModalHidden)
      
      // フォーカスを適切な要素に戻す（数量入力フィールド）
      const currentQuantityInput = this.currentFormGroup.querySelector("[data-price-calculator-target='quantityInput']")
      if (currentQuantityInput) {
        setTimeout(() => {
          currentQuantityInput.focus()
          currentQuantityInput.select()
        }, 100) // モーダル閉鎖アニメーション完了後にフォーカス
      }
      
      // 合計金額を再計算
      this.updateTotalPrice()
    }
    
    modalElement.addEventListener('hidden.bs.modal', handleModalHidden)
    modal.hide()

    // フォーム内の数量変更時に再計算するイベントリスナーを追加（重複防止）
    if (this.quantityChangeHandler) {
      quantityInput.removeEventListener("change", this.quantityChangeHandler)
    }
    this.quantityChangeHandler = () => this.updateItemTotal(this.currentFormGroup)
    quantityInput.addEventListener("change", this.quantityChangeHandler)
  }

  filterProducts() {
    const searchQuery = this.searchInputTarget.value.toLowerCase()
    
    // 選択されたカテゴリを取得（複数選択対応）
    const selectedCategories = []
    const allCategoryCheckbox = this.categoryCheckboxTargets.find(checkbox => checkbox.dataset.category === 'all')
    
    if (allCategoryCheckbox && allCategoryCheckbox.checked) {
      selectedCategories.push('all')
    } else {
      this.categoryCheckboxTargets.forEach((checkbox) => {
        if (checkbox.checked && checkbox.dataset.category !== 'all') {
          selectedCategories.push(checkbox.dataset.category)
        }
      })
    }

    let visibleCount = 0

    this.productListTarget.querySelectorAll("tr").forEach((row) => {
      const productName = row.getAttribute("data-name").toLowerCase()
      const productDescription = row.getAttribute("data-description").toLowerCase()
      const productCategory = row.getAttribute("data-category")

      // テキスト検索（商品名と説明文）
      const matchesSearch = productName.includes(searchQuery) || productDescription.includes(searchQuery)
      
      // カテゴリフィルタリング
      let matchesCategory = false
      if (selectedCategories.includes('all') || selectedCategories.length === 0) {
        matchesCategory = true
      } else {
        matchesCategory = selectedCategories.includes(productCategory)
      }

      if (matchesSearch && matchesCategory) {
        row.style.display = ""
        visibleCount++
        this.highlightText(row, searchQuery)
      } else {
        row.style.display = "none"
      }
    })

    this.updateResultCount(visibleCount)
  }

  sortProducts() {
    const sortValue = this.sortSelectTarget.value
    const rows = Array.from(this.productListTarget.querySelectorAll("tr"))
    
    rows.sort((a, b) => {
      const aName = a.getAttribute("data-name")
      const bName = b.getAttribute("data-name")
      const aPrice = parseFloat(a.getAttribute("data-price"))
      const bPrice = parseFloat(b.getAttribute("data-price"))
      const aStock = parseInt(a.getAttribute("data-stock"))
      const bStock = parseInt(b.getAttribute("data-stock"))

      switch (sortValue) {
        case 'name_asc':
          return aName.localeCompare(bName)
        case 'name_desc':
          return bName.localeCompare(aName)
        case 'price_asc':
          return aPrice - bPrice
        case 'price_desc':
          return bPrice - aPrice
        case 'stock_asc':
          return aStock - bStock
        case 'stock_desc':
          return bStock - aStock
        default:
          return 0
      }
    })

    // ソート済みの行を再配置
    rows.forEach(row => this.productListTarget.appendChild(row))
  }

  clearFilters() {
    this.searchInputTarget.value = ''
    this.sortSelectTarget.value = 'name_asc'
    
    // 全てのカテゴリチェックボックスをクリア
    this.categoryCheckboxTargets.forEach(checkbox => {
      if (checkbox.dataset.category === 'all') {
        checkbox.checked = true
      } else {
        checkbox.checked = false
      }
    })

    this.filterProducts()
  }

  toggleAdvancedSearch() {
    const advancedSearchCollapse = document.getElementById('advancedSearch')
    const toggleButton = this.advancedToggleTarget
    
    if (advancedSearchCollapse.classList.contains('show')) {
      toggleButton.innerHTML = '<i class="fas fa-cog me-1"></i>詳細'
      toggleButton.classList.remove('btn-primary')
      toggleButton.classList.add('btn-outline-primary')
    } else {
      toggleButton.innerHTML = '<i class="fas fa-cog me-1"></i>簡単'
      toggleButton.classList.remove('btn-outline-primary')
      toggleButton.classList.add('btn-primary')
    }
  }

  highlightText(row, searchQuery) {
    if (!searchQuery) return

    const nameElement = row.querySelector('[data-highlight-target="name"]')
    const descriptionElement = row.querySelector('[data-highlight-target="description"]')

    if (nameElement) {
      this.applyHighlight(nameElement, searchQuery)
    }
    if (descriptionElement) {
      this.applyHighlight(descriptionElement, searchQuery)
    }
  }

  applyHighlight(element, searchQuery) {
    const originalText = element.textContent
    const regex = new RegExp(`(${searchQuery})`, 'gi')
    const highlightedText = originalText.replace(regex, '<mark class="bg-warning">$1</mark>')
    element.innerHTML = highlightedText
  }

  formatPrice(price) {
    return `¥${price.toLocaleString()}`
  }

  getAllProducts() {
    if (!this.productListTarget) {
      console.warn('Product list target not found')
      return []
    }
    
    return Array.from(this.productListTarget.querySelectorAll("tr")).map(row => ({
      name: row.getAttribute("data-name") || "",
      category: row.getAttribute("data-category") || "未分類",
      price: parseFloat(row.getAttribute("data-price")) || 0,
      stock: parseInt(row.getAttribute("data-stock")) || 0,
      description: row.getAttribute("data-description") || "",
      element: row
    }))
  }

  updateResultCount(count = null) {
    if (count === null) {
      count = this.productListTarget.querySelectorAll("tr[style='']").length
    }
    this.resultCountTarget.textContent = count
  }

  setupCategoryFilters() {
    // 「全て」チェックボックスの特別な処理
    const allCategoryCheckbox = this.categoryCheckboxTargets.find(checkbox => checkbox.dataset.category === 'all')
    
    if (allCategoryCheckbox) {
      allCategoryCheckbox.addEventListener('change', () => {
        if (allCategoryCheckbox.checked) {
          // 「全て」がチェックされた場合、他のチェックボックスをクリア
          this.categoryCheckboxTargets.forEach(checkbox => {
            if (checkbox.dataset.category !== 'all') {
              checkbox.checked = false
            }
          })
        }
      })
    }

    // 個別カテゴリチェックボックスの処理
    this.categoryCheckboxTargets.forEach(checkbox => {
      if (checkbox.dataset.category !== 'all') {
        checkbox.addEventListener('change', () => {
          if (checkbox.checked && allCategoryCheckbox) {
            // 個別カテゴリがチェックされた場合、「全て」をクリア
            allCategoryCheckbox.checked = false
          }
        })
      }
    })
  }

  setupModalFocusManagement() {
    const modalElement = document.getElementById("productModal")
    if (!modalElement) return

    // ESCキーやX ボタンでモーダルが閉じられた時の処理
    modalElement.addEventListener('hidden.bs.modal', (event) => {
      // selectProductメソッドで処理されない場合のフォールバック
      if (!event.defaultPrevented && this.currentFormGroup) {
        const selectButton = this.currentFormGroup.querySelector("[data-action*='openProductModal']")
        if (selectButton) {
          setTimeout(() => selectButton.focus(), 100)
        }
      }
    })
  }
}
