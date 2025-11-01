class CompaniesController < ApplicationController
  before_action :authenticate_user!
  before_action :ensure_superuser
  before_action :set_company, only: [:show, :edit, :update, :destroy]

  def index
    @companies = Company.kept
  end

  def show
  end

  def new
    @company = Company.new
    respond_to do |format|
      format.html { render :new }
      format.turbo_stream
    end
  end

  def create
    @company = Company.new(company_params)
    if @company.save
      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to companies_path, notice: "企業が作成されました。" }
      end
    else
      respond_to do |format|
        format.turbo_stream { render turbo_stream: turbo_stream.replace("company_form", partial: "form", locals: { company: @company }) }
        format.html { render :new }
      end
    end
  end

  def edit
  end

  def update
    if @company.update(company_params)
      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to companies_path, notice: "企業情報が更新されました。" }
      end
    else
      respond_to do |format|
        format.turbo_stream { render turbo_stream: turbo_stream.replace("company_form", partial: "form", locals: { company: @company }) }
        format.html { render :edit }
      end
    end
  end

  def destroy
    @company.destroy
    respond_to do |format|
      format.turbo_stream {
        render turbo_stream: [
          turbo_stream.remove("company_#{@company.id}")
        ]
      }
      format.html { redirect_to companies_path, notice: "企業が削除されました。" }
    end
  end

  private

  def set_company
    @company = Company.find(params[:id])
  end

  def ensure_superuser
    unless current_user.superuser?
      respond_to do |format|
        format.html { redirect_to root_path, alert: "アクセス権限がありません。" }
        format.json { render json: { error: "アクセス権限がありません。" }, status: :forbidden }
      end
    end
  end

  def company_params
    params.require(:company).permit(:name)
  end
end
