const IMPORT_RECEIPT_STATUS = Object.freeze({
    requested: 'requested',
    approved: 'approved',
    processing: 'processing',
    completed: 'completed',
    rejected: 'rejected',
    received: 'received',
    returned: 'returned',
});

const PRODUCT_META_KEY = Object.freeze({
    color: 'color',
    material: 'material',
    style: 'style',
    size: 'size',
    weight: 'weight',
    width: 'width',
    height: 'height',
    length: 'length',
    brand: 'brand',
    origin: 'origin',
    warranty: 'warranty',
    assembly_required: 'assembly_required',
    care_instructions: 'care_instructions',
    finish: 'finish',
    room_type: 'room_type',
    seating_capacity: 'seating_capacity',
    max_weight_capacity: 'max_weight_capacity',
    package_contents: 'package_contents',
    eco_friendly: 'eco_friendly',
    foldable: 'foldable',
    adjustable: 'adjustable',
    stackable: 'stackable',
    fire_resistant: 'fire_resistant',
    water_resistant: 'water_resistant',
    uv_resistant: 'uv_resistant',
    // Add more as needed for furniture
});

const PRODUCT_META_KEY_TRANSLATE = Object.freeze({
    color: 'Màu sắc',
    material: 'Chất liệu',
    style: 'Phong cách',
    size: 'Kích thước',
    weight: 'Trọng lượng',
    width: 'Chiều rộng',
    height: 'Chiều cao',
    length: 'Chiều dài',
    brand: 'Thương hiệu',
    origin: 'Xuất xứ',
    warranty: 'Bảo hành',
    assembly_required: 'Cần lắp ráp',
    care_instructions: 'Hướng dẫn bảo quản',
    finish: 'Hoàn thiện',
    room_type: 'Loại phòng',
    seating_capacity: 'Sức chứa',
    max_weight_capacity: 'Tải trọng tối đa',
    package_contents: 'Bộ sản phẩm gồm',
    eco_friendly: 'Thân thiện môi trường',
    foldable: 'Gấp gọn',
    adjustable: 'Điều chỉnh được',
    stackable: 'Xếp chồng',
    fire_resistant: 'Chống cháy',
    water_resistant: 'Chống nước',
    uv_resistant: 'Chống tia UV',
    // Add more as needed for furniture
});

const PRODUCT_META_KEY_LIST = [
    { key: 'color', translate: 'Màu sắc' },
    { key: 'material', translate: 'Chất liệu' },
    { key: 'style', translate: 'Phong cách' },
    { key: 'size', translate: 'Kích thước' },
    { key: 'weight', translate: 'Trọng lượng' },
    { key: 'width', translate: 'Chiều rộng' },
    { key: 'height', translate: 'Chiều cao' },
    { key: 'length', translate: 'Chiều dài' },
    { key: 'brand', translate: 'Thương hiệu' },
    { key: 'origin', translate: 'Xuất xứ' },
    { key: 'warranty', translate: 'Bảo hành' },
    { key: 'assembly_required', translate: 'Cần lắp ráp' },
    { key: 'care_instructions', translate: 'Hướng dẫn bảo quản' },
    { key: 'finish', translate: 'Hoàn thiện' },
    { key: 'room_type', translate: 'Loại phòng' },
    { key: 'seating_capacity', translate: 'Sức chứa' },
    { key: 'max_weight_capacity', translate: 'Tải trọng tối đa' },
    { key: 'package_contents', translate: 'Bộ sản phẩm gồm' },
    { key: 'eco_friendly', translate: 'Thân thiện môi trường' },
    { key: 'foldable', translate: 'Gấp gọn' },
    { key: 'adjustable', translate: 'Điều chỉnh được' },
    { key: 'stackable', translate: 'Xếp chồng' },
    { key: 'fire_resistant', translate: 'Chống cháy' },
    { key: 'water_resistant', translate: 'Chống nước' },
    { key: 'uv_resistant', translate: 'Chống tia UV' },
    // Add more as needed for furniture
];

module.exports = {
    IMPORT_RECEIPT_STATUS,
    PRODUCT_META_KEY,
    PRODUCT_META_KEY_TRANSLATE,
    PRODUCT_META_KEY_LIST,
};
