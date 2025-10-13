import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["collapse"]

  connect() {
    // メニューリンクをクリックしたときに自動的に閉じる
    if (this.hasCollapseTarget) {
      const links = this.collapseTarget.querySelectorAll('a.nav-link')
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          // モバイルサイズの場合のみメニューを閉じる
          if (window.innerWidth < 992) {
            // 少し遅延させてからメニューを閉じる（ナビゲーションを妨げない）
            setTimeout(() => {
              const bsCollapse = bootstrap.Collapse.getInstance(this.collapseTarget)
              if (bsCollapse) {
                bsCollapse.hide()
              }
            }, 100)
          }
        })
      })
    }

    // スクロール時のヘッダースタイル変更
    if (window.innerWidth < 992) {
      this.handleScroll = this.handleScroll.bind(this)
      window.addEventListener('scroll', this.handleScroll)
      this.handleScroll() // 初回実行
    }
  }

  disconnect() {
    if (this.handleScroll) {
      window.removeEventListener('scroll', this.handleScroll)
    }
  }

  handleScroll() {
    const header = document.querySelector('.header-wrapper')
    if (header) {
      if (window.scrollY > 10) {
        header.classList.add('scrolled')
      } else {
        header.classList.remove('scrolled')
      }
    }
  }

  // メニューが開いたとき
  show(event) {
    // body のスクロールを防ぐ
    if (window.innerWidth < 992) {
      document.body.style.overflow = 'hidden'
    }
  }

  // メニューが閉じたとき
  hide(event) {
    // body のスクロールを戻す
    document.body.style.overflow = ''
  }
}
