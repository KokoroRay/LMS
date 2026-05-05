import React, { useState, useRef, useEffect } from 'react'
import { Input } from 'antd'
import { SearchOutlined, CloseOutlined } from '@ant-design/icons'

const HeaderSearch = ({ onSearch }) => {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState('')
    const inputRef = useRef(null)

    useEffect(() => {
        if (open) {
            const t = setTimeout(() => inputRef.current?.focus(), 120)
            return () => clearTimeout(t)
        }
    }, [open])

    const handleToggle = () => setOpen((s) => !s)
    const handleSearch = (v) => onSearch?.(v)

    return (
        <div className={`header-search ${open ? 'open' : ''}`}>
            <button className="search-icon-btn" aria-label="Search" onClick={handleToggle}>
                {open ? <CloseOutlined /> : <SearchOutlined />}
            </button>
            <div className="search-field-wrap">
                <Input
                    ref={inputRef}
                    allowClear
                    size="large"
                    placeholder="Tìm kiếm môn học, bài viết..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onPressEnter={(e) => handleSearch(e.target.value)}
                />
            </div>
        </div>
    )
}

export default HeaderSearch 