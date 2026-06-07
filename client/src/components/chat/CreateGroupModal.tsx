import React, { useState, useEffect } from 'react'
import { Modal, Input, List, Avatar, Checkbox, message, Typography } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { chatService } from '../../services/chatService'
import { friendService } from '../../services/friendService'

const { Text } = Typography

interface CreateGroupModalProps {
  visible: boolean
  onClose: () => void
  onCreated: (convId: number) => void
}

export default function CreateGroupModal({ visible, onClose, onCreated }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('')
  const [friends, setFriends] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingFriends, setLoadingFriends] = useState(false)

  useEffect(() => {
    if (visible) {
      setGroupName('')
      setSelectedIds([])
      loadFriends()
    }
  }, [visible])

  const loadFriends = async () => {
    setLoadingFriends(true)
    try {
      const res: any = await friendService.getFriends()
      if (res.code === 200) {
        const allFriends = (res.data || []).flatMap((g: any) => g.friends || [])
        setFriends(allFriends)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingFriends(false)
    }
  }

  const handleCreate = async () => {
    if (!groupName.trim()) {
      message.warning('请输入群组名称')
      return
    }
    if (selectedIds.length === 0) {
      message.warning('请选择至少一个好友')
      return
    }
    setLoading(true)
    try {
      const res: any = await chatService.createConversation({
        type: 'group',
        name: groupName,
        member_ids: selectedIds,
      })
      if (res.code === 200) {
        message.success('群组创建成功')
        onCreated(res.data.id)
        onClose()
      }
    } catch (err: any) {
      message.error(err?.message || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const toggleFriend = (friendId: number) => {
    setSelectedIds(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  return (
    <Modal
      title="创建群聊"
      open={visible}
      onOk={handleCreate}
      onCancel={onClose}
      confirmLoading={loading}
      okText="创建"
      width={480}
    >
      <Input
        placeholder="群组名称"
        value={groupName}
        onChange={e => setGroupName(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        选择群成员（{selectedIds.length} 人已选）
      </Text>
      <div style={{ maxHeight: 320, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 6 }}>
        <List
          loading={loadingFriends}
          dataSource={friends}
          locale={{ emptyText: '暂无好友，先去添加好友吧' }}
          renderItem={(item: any) => (
            <List.Item
              onClick={() => toggleFriend(item.friend?.id)}
              style={{ cursor: 'pointer', padding: '8px 12px' }}
            >
              <Checkbox checked={selectedIds.includes(item.friend?.id)} onClick={e => e.stopPropagation()} onChange={() => toggleFriend(item.friend?.id)} />
              <List.Item.Meta
                avatar={<Avatar src={item.friend?.avatar} icon={<UserOutlined />} />}
                title={item.remark || item.friend?.nickname || item.friend?.username}
                style={{ marginLeft: 12 }}
              />
            </List.Item>
          )}
        />
      </div>
    </Modal>
  )
}
