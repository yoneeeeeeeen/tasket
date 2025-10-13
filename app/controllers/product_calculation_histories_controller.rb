class ProductCalculationHistoriesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_history, only: [:show, :destroy]

  def index
    @histories = current_user.product_calculation_histories.includes(items: :product).page(params[:page]).per(10)
  end

  def show
    @items = @history.items.includes(:product)
  end

  def create
    @history = current_user.product_calculation_histories.build(history_params)
    @history.saved_at = Time.current
    
    if @history.save
      render json: { success: true, message: '計算履歴を保存しました。', history_id: @history.id }, status: :created
    else
      render json: { success: false, errors: @history.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @history.destroy
    respond_to do |format|
      format.html { redirect_to product_calculation_histories_path, notice: '履歴を削除しました。' }
      format.json { head :no_content }
    end
  end

  private

  def set_history
    @history = current_user.product_calculation_histories.find(params[:id])
  end

  def history_params
    params.require(:product_calculation_history).permit(
      :title,
      :total_amount,
      items_attributes: [:product_id, :quantity, :price, :subtotal]
    )
  end
end
