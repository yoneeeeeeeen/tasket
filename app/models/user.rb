class User < ApplicationRecord
  include Discard::Model
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  before_validation :set_default_role, on: :create
  after_create :initialize_menu_settings

  ROLES = { superuser: "管理者", user: "一般" }.freeze

  validates :email, presence: true, uniqueness: true
  validates :name, presence: true
  validates :role, inclusion: { in: ["superuser", "user"] }

  has_many :categories, dependent: :destroy
  has_many :products, dependent: :destroy
  has_many :user_menus, dependent: :destroy
  has_many :menus, through: :user_menus
  has_many :events, dependent: :destroy
  has_many :reminders, through: :events
  has_many :product_calculation_histories, dependent: :destroy

  # スーパーユーザー判定メソッド
  def superuser?
    self.role == "superuser"
  end

  # 本日のリマインダーを取得するメソッド
  def today_reminders
    reminders.today.for_kept_events.by_date
  end

  # 未確認の本日のリマインダーがあるかチェック
  def has_today_reminders?
    today_reminders.exists?
  end

  # 今日初回ログインかどうかを判定
  def first_login_today?
    return true if last_sign_in_at.nil? # 初回ログイン
    last_sign_in_at < Time.current.beginning_of_day
  end

  # ユーザーの表示メニューを取得するメソッド
  def visible_menus
    # UserMenuが存在するメニューはその設定を使用
    # 存在しないメニューはデフォルトのactive設定を使用
    Menu.ordered.left_outer_joins(:user_menus)
        .where('(user_menus.user_id = ? AND user_menus.active = true) OR (user_menus.user_id IS NULL AND menus.active = true)', id)
  end

  # 初回アクセス時などにユーザーのメニュー設定を初期化
  def initialize_menu_settings
    Menu.all.each do |menu|
      user_menus.find_or_create_by(menu: menu) do |user_menu|
        user_menu.active = menu.active
      end
    end
  end

  private

  def set_default_role
    self.role ||= "user"
  end
end
