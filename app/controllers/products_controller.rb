class ProductsController < ApplicationController
  require 'csv'
  before_action :set_product, only: %i[show edit update destroy]
  before_action :authenticate_user!
  before_action :set_categories, only: %i[new edit create update calculate icon_calculate]

  def index
    @q = Product.ransack(params[:q])
    @products = @q.result.includes(:category).page(params[:page]).per(10).where(discarded_at: nil, user_id: current_user.id)

    # 並び替えの処理
    if params[:sort].present?
      @products = @products.order(params[:sort] => params[:direction] || 'asc')
    end

    @product = Product.new

    respond_to do |format|
      format.turbo_stream { render partial: "products/list", locals: { products: @products } }
      format.html
      format.xlsx do
        response.headers["Content-Disposition"] = 'attachment; filename="products.xlsx"'
      end
      format.csv { send_data generate_csv(@products), filename: "商品一覧_#{Time.zone.now.strftime('%Y%m%d')}.csv" }
      format.json {
        latest_update = @products.maximum(:updated_at)&.iso8601 || Time.current.iso8601
        render json: { last_update: latest_update, count: @products.count }
      }
    end
  end

  def show
  end

  def new
    @product = Product.new
    respond_to do |format|
      format.turbo_stream { render partial: "products/form", locals: { product: @product } }
      format.html { render :new }
    end
  end

  def create
    @product = Product.new(product_params)
    @product.user = current_user

    if @product.save
      respond_to do |format|
        format.turbo_stream {
          render turbo_stream: [
            turbo_stream.append("products", partial: "products/product", locals: { product: @product }),
            turbo_stream.replace("product_form", partial: "products/form", locals: { product: Product.new }),
            turbo_stream.prepend("flash_messages", partial: "shared/flash", locals: { flash_type: "success", message: "商品が作成されました。" })
          ]
        }
        format.html { redirect_to products_path, notice: "商品が作成されました。" }
      end
    else
      respond_to do |format|
        format.turbo_stream {
          render turbo_stream: turbo_stream.replace("product_form", partial: "products/form", locals: { product: @product })
        }
        format.html { render :new }
      end
    end
  end

  def edit
    @product = Product.find(params[:id])

    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: turbo_stream.replace("product_details_#{@product.id}", partial: "form", locals: { product: @product })
      end
      format.html # HTMLフォーマットも必要な場合
    end
  end

  def update
    if @product.update(product_params)
      respond_to do |format|
        format.turbo_stream {
          render turbo_stream: [
            turbo_stream.replace("product_#{@product.id}", partial: "products/product", locals: { product: @product }),
            turbo_stream.prepend("flash_messages", partial: "shared/flash", locals: { flash_type: "success", message: "商品が更新されました。" })
          ]
        }
        format.html { redirect_to @product, notice: '商品が更新されました。' }
        format.json { render json: { success: true, product: @product, message: '商品が更新されました。' } }
      end
    else
      respond_to do |format|
        format.turbo_stream {
          render turbo_stream: [
            turbo_stream.replace("product_form", partial: "products/form", locals: { product: @product }),
            turbo_stream.prepend("flash_messages", partial: "shared/flash", locals: { flash_type: "danger", message: "更新できませんでした。入力内容を確認してください。" })
          ]
        }
        format.html { render :edit }
        format.json { render json: { success: false, errors: @product.errors }, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @product = Product.find(params[:id])
    @product.discard # 論理削除

    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: [
          turbo_stream.remove("product_#{@product.id}"),
          turbo_stream.prepend("flash_messages", partial: "shared/flash", locals: { flash_type: "success", message: "商品が削除されました。" })
        ]
      end
      format.html { redirect_to products_url, notice: '商品が削除されました。' }
      format.json { head :no_content }
    end
  end

  def search
    @q = Product.ransack(params[:q])
    @products = @q.result.includes(:category).limit(10)

    respond_to do |format|
      format.html { render partial: "products/search_results", locals: { products: @products } }
      format.json { render json: @products }
    end
  end

  def calculate
    @products = Product.includes(:category).where(user: current_user, discarded_at: nil)
    # 念のため@categoriesを明示的に設定
    @categories ||= Category.where(user: current_user)
  end

  def icon_calculate
    @products = Product.includes(:category).where(user: current_user, discarded_at: nil)
    @categories ||= Category.where(user: current_user)
  end

  def export_empty_csv
    csv_data = CSV.generate(headers: true) do |csv|
      # ヘッダー行を追加
      csv << ["商品名", "価格", "在庫数", "カテゴリ"]
    end

    send_data csv_data, filename: "空のテンプレート.csv", type: "text/csv"
  end

  def import_csv
    if request.get?
      render :import
    elsif request.post?
      file = params[:file]
      if file.nil? || file.size.zero?
        flash[:alert] = "ファイルが選択されていないか、空のファイルです。"
        redirect_to import_csv_products_path
        return
      end

      errors = []
      begin
        CSV.foreach(file.path, headers: true).with_index(1) do |row, line_number|
          if row["商品名"].blank?
            errors << "行 #{line_number}: 商品名が空です。"
            next
          end

          if row["価格"].blank? || row["価格"].to_f < 0
            errors << "行 #{line_number}: 価格が空、または0以上の値ではありません。"
            next
          end

          if row["在庫数"].blank? || row["在庫数"].to_i < 0
            errors << "行 #{line_number}: 在庫数が空、または0以上の値ではありません。"
            next
          end

          if row["カテゴリ"].blank?
            errors << "行 #{line_number}: カテゴリが空です。"
            next
          end

          product = Product.new(
            name: row["商品名"],
            price: row["価格"].to_f,
            stock_quantity: row["在庫数"].to_i,
            description: row["説明文"].presence || "説明がありません",
            category: Category.find_or_create_by(name: row["カテゴリ"])
          )

          unless product.save
            errors << "行 #{line_number}: #{product.errors.full_messages.join(', ')}"
          end
        end
      rescue => e
        errors << "CSVの読み込み中にエラーが発生しました: #{e.message}"
      end

      if errors.any?
        flash[:alert] = "以下のエラーが発生しました:\n#{errors.join("\n")}"
      else
        flash[:notice] = "CSVを正常に取り込みました。"
      end

      redirect_to products_path
    end
  end

  private

  def set_categories
    @categories = Category.where(user: current_user)
  end

  def set_product
    @product = current_user.products.find(params[:id])
  end

  def product_params
    params.require(:product).permit(:name, :description, :price, :stock_quantity, :category_id)
  end

  def generate_csv(products)
    CSV.generate(headers: true) do |csv|
      # ヘッダー行を追加
      csv << ["商品ID", "商品名", "価格", "在庫数", "カテゴリ"]

      # 商品データを追加
      products.each do |product|
        csv << [
          product.id,
          product.name,
          product.price,
          product.stock_quantity,
          product.category&.name || "未分類" # カテゴリがない場合は "未分類" を表示
        ]
      end
    end
  end
end
