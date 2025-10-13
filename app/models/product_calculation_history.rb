class ProductCalculationHistory < ApplicationRecord
  belongs_to :user
  has_many :items, class_name: 'ProductCalculationHistoryItem', dependent: :destroy
  
  validates :title, presence: true
  validates :total_amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :saved_at, presence: true
  
  accepts_nested_attributes_for :items
  
  default_scope { order(saved_at: :desc) }
end
