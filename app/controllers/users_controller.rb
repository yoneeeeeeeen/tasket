class UsersController < ApplicationController
  before_action :authenticate_user! # ログインしていない場合はリダイレクト
  before_action :ensure_superuser   # スーパーユーザーのみアクセス可能

  def index
    @users = User.kept # 論理削除されていないユーザーのみ取得
  end

  def new
    @user = User.new
    respond_to do |format|
      format.html { render :new }
      format.turbo_stream
    end
  end

  def create
    @user = User.new(user_params)

    # トランザクションを使用して、ユーザー作成とメニュー関連付けを一括で行う
    User.transaction do
      if @user.save
        # ApplicationControllerのメソッドを呼び出し
        assign_all_menus_to_user(@user)

        respond_to do |format|
          format.turbo_stream
          format.html { redirect_to users_path, notice: "ユーザー登録が成功しました。" }
        end
      else
        respond_to do |format|
          format.turbo_stream { render turbo_stream: turbo_stream.replace("user_form", partial: "form", locals: { user: @user }) }
          format.html { render :new }
        end
      end
    end
  rescue ActiveRecord::RecordInvalid => e
    @user.errors.add(:base, "メニュー関連付けに失敗しました: #{e.message}") if @user.errors.empty?
    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.replace("user_form", partial: "form", locals: { user: @user }) }
      format.html { render :new }
    end
  end

  def edit
    @user = User.find(params[:id]) # 編集するユーザーを取得
  end

  def update
    @user = User.find(params[:id])
    if @user.update(user_params)
      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to users_path, notice: "ユーザー情報が更新されました。" }
      end
    else
      respond_to do |format|
        format.turbo_stream { render turbo_stream: turbo_stream.replace("user_form", partial: "form", locals: { user: @user }) }
        format.html { render :edit }
      end
    end
  end

  def destroy
    @user = User.find(params[:id])
    @user.destroy # 物理削除を実行
    respond_to do |format|
      format.turbo_stream {
        render turbo_stream: [
          turbo_stream.remove("user_#{@user.id}")
        ]
      }
      format.html { redirect_to users_path, notice: "ユーザーが削除されました。" }
    end
  end

  private

  def ensure_superuser
    unless current_user.superuser?
      respond_to do |format|
        format.html { redirect_to root_path, alert: "アクセス権限がありません。" }
        format.json { render json: { error: "アクセス権限がありません。" }, status: :forbidden }
      end
    end
  end

  def user_params
    params.require(:user).permit(:name, :email, :role, :company_id, :password, :password_confirmation)
  end
end
