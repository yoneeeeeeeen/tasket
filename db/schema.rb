# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_10_13_040835) do
  create_table "categories", charset: "utf8mb4", collation: "utf8mb4_uca1400_ai_ci", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_categories_on_user_id"
  end

  create_table "events", charset: "utf8mb3", collation: "utf8mb3_general_ci", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.datetime "start_date"
    t.datetime "end_date"
    t.datetime "discarded_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_events_on_user_id"
  end

  create_table "menus", charset: "utf8mb4", collation: "utf8mb4_uca1400_ai_ci", force: :cascade do |t|
    t.string "name"
    t.string "path"
    t.string "icon"
    t.integer "display_order"
    t.boolean "active"
    t.string "role"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_menus_on_name", unique: true
    t.index ["path"], name: "index_menus_on_path", unique: true
    t.index ["role"], name: "index_menus_on_role"
  end

  create_table "product_calculation_histories", charset: "utf8mb3", collation: "utf8mb3_general_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "title"
    t.decimal "total_amount", precision: 10
    t.datetime "saved_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_product_calculation_histories_on_user_id"
  end

  create_table "product_calculation_history_items", charset: "utf8mb3", collation: "utf8mb3_general_ci", force: :cascade do |t|
    t.bigint "product_calculation_history_id", null: false
    t.bigint "product_id", null: false
    t.integer "quantity"
    t.decimal "price", precision: 10
    t.decimal "subtotal", precision: 10
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_calculation_history_id"], name: "idx_on_product_calculation_history_id_e8bba2b53d"
    t.index ["product_id"], name: "index_product_calculation_history_items_on_product_id"
  end

  create_table "products", charset: "utf8mb4", collation: "utf8mb4_uca1400_ai_ci", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.decimal "price", precision: 10, scale: 2, null: false
    t.integer "stock_quantity", default: 0, null: false
    t.string "image_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "category_id"
    t.datetime "discarded_at"
    t.bigint "user_id", null: false
    t.index ["category_id"], name: "index_products_on_category_id"
    t.index ["discarded_at"], name: "index_products_on_discarded_at"
    t.index ["user_id"], name: "index_products_on_user_id"
  end

  create_table "reminders", charset: "utf8mb4", collation: "utf8mb4_uca1400_ai_ci", force: :cascade do |t|
    t.string "title"
    t.datetime "remind_at"
    t.bigint "event_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id", "remind_at"], name: "index_reminders_on_event_id_and_remind_at", unique: true
    t.index ["event_id"], name: "index_reminders_on_event_id"
    t.index ["remind_at"], name: "index_reminders_on_remind_at"
  end

  create_table "tags", charset: "utf8mb4", collation: "utf8mb4_uca1400_ai_ci", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_tags_on_name", unique: true
  end

  create_table "task_tags", charset: "utf8mb4", collation: "utf8mb4_uca1400_ai_ci", force: :cascade do |t|
    t.bigint "task_id", null: false
    t.bigint "tag_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tag_id"], name: "index_task_tags_on_tag_id"
    t.index ["task_id", "tag_id"], name: "index_task_tags_on_task_id_and_tag_id", unique: true
    t.index ["task_id"], name: "index_task_tags_on_task_id"
  end

  create_table "tasks", charset: "utf8mb4", collation: "utf8mb4_uca1400_ai_ci", force: :cascade do |t|
    t.string "title"
    t.text "description"
    t.string "status"
    t.string "priority"
    t.datetime "due_date"
    t.bigint "user_id", null: false
    t.bigint "parent_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["parent_id"], name: "index_tasks_on_parent_id"
    t.index ["user_id", "due_date"], name: "index_tasks_on_user_id_and_due_date", unique: true
    t.index ["user_id", "priority"], name: "index_tasks_on_user_id_and_priority", unique: true
    t.index ["user_id", "status"], name: "index_tasks_on_user_id_and_status", unique: true
    t.index ["user_id"], name: "index_tasks_on_user_id"
  end

  create_table "user_menus", charset: "utf8mb4", collation: "utf8mb4_uca1400_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "menu_id", null: false
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["menu_id"], name: "index_user_menus_on_menu_id"
    t.index ["user_id", "menu_id"], name: "index_user_menus_on_user_id_and_menu_id", unique: true
    t.index ["user_id"], name: "index_user_menus_on_user_id"
  end

  create_table "users", charset: "utf8mb4", collation: "utf8mb4_uca1400_ai_ci", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.string "name"
    t.datetime "discarded_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "role", default: "user", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "categories", "users"
  add_foreign_key "events", "users"
  add_foreign_key "product_calculation_histories", "users"
  add_foreign_key "product_calculation_history_items", "product_calculation_histories"
  add_foreign_key "product_calculation_history_items", "products"
  add_foreign_key "products", "categories"
  add_foreign_key "reminders", "events"
  add_foreign_key "task_tags", "tags"
  add_foreign_key "task_tags", "tasks"
  add_foreign_key "tasks", "tasks", column: "parent_id"
  add_foreign_key "tasks", "users"
  add_foreign_key "user_menus", "menus"
  add_foreign_key "user_menus", "users"
end
