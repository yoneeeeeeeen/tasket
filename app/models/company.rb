class Company < ApplicationRecord
  include Discard::Model

  validates :name, presence: true, uniqueness: true

  has_many :users, dependent: :nullify
  has_many :products, dependent: :nullify
end
