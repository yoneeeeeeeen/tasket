class Product < ApplicationRecord
  include Discard::Model
  # category_idカラムを使用して、Categoryモデルと関連付け
  belongs_to :category, optional: true  # optional: true で関連を任意に設定
  belongs_to :user
  belongs_to :company

  # Active Storageで画像を添付
  has_one_attached :image

  validates :name, presence: true
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :stock_quantity, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  # 既存のransackable_attributesメソッドにcategory_idを追加
  def self.ransackable_attributes(auth_object = nil)
    %w[name price stock_quantity description category_id]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[category]
  end

  def to_s
    name
  end
end
