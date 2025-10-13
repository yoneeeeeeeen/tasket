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
