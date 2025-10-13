class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  layout :layout_by_resource

  protect_from_forgery with: :exception
  before_action :authenticate_user!
  before_action :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name])
  end

  def assign_all_menus_to_user(user)
    # メニューを全て取得して関連付け
    menus = Menu.all
    menus.each do |menu|
      UserMenu.create!(
        user_id: user.id,
        menu_id: menu.id,
        active: true
      )
    end
    true
  rescue => e
    Rails.logger.error "メニュー関連付けエラー: #{e.message}"
    false
  end

  # このメソッドをコントローラー内でのみ使用可能にする（プライベートメソッド）
  private :assign_all_menus_to_user
  def after_sign_in_path_for(resource)
    # ログイン後にセッションフラグを設定
    session[:show_reminders_today] = true
    stored_location_for(resource) || root_path
  end

  private

  def layout_by_resource
    if devise_controller?
      "login"
    else
      "application"
    end
  end
end
