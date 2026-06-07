import React, { useState } from 'react'
import { List, Avatar, Collapse, Dropdown, Typography, Badge, Empty, Modal, Input, message, Button } from 'antd'
import {
  UserOutlined, EllipsisOutlined, FolderAddOutlined,
  DeleteOutlined, SwapOutlined, MessageOutlined,
} from '@ant-design/icons'
import { friendService } from '../../services/friendService'

const { Text } = Typography

interface FriendListProps {
  groups: any[]
  onMoveFriend: (friendId: number, groupId: number | null) => void
  onDeleteFriend: (friendId: number) => void
  onStartChat: (friendUserId: number) => void
  onRefresh: () => void
}

export default function FriendList({ groups, onMoveFriend, onDeleteFriend, onStartChat, onRefresh }: FriendListProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [renameGroupId, setRenameGroupId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    try {
      const res: any = await friendService.createGroup(newGroupName)
      if (res.code === 200) {
        message.success('分组创建成功')
        setCreateModalOpen(false)
        setNewGroupName('')
        onRefresh()
      }
    } catch (err) { /* ignore */ }
  }

  const handleRenameGroup = async () => {
    if (!renameGroupId || !renameValue.trim()) return
    try {
      const res: any = await friendService.renameGroup(renameGroupId, renameValue)
      if (res.code === 200) {
        message.success('分组重命名成功')
        setRenameModalOpen(false)
        onRefresh()
      }
    } catch (err) { /* ignore */ }
  }

  const handleDeleteGroup = async (groupId: number) => {
    try {
      const res: any = await friendService.deleteGroup(groupId)
      if (res.code === 200) {
        message.success('分组已删除')
        onRefresh()
      }
    } catch (err) { /* ignore */ }
  }

  const getFriendMenu = (friend: any) => ({
    items: [
      {
        key: 'chat',
        icon: <MessageOutlined />,
        label: '发送消息',
        onClick: () => onStartChat(friend.friend?.id),
      },
      { type: 'divider' as const },
      {
        key: 'move',
        icon: <SwapOutlined />,
        label: '移动到分组',
        children: groups.filter(g => g.id !== 0).map(g => ({
          key: `move-${g.id}`,
          label: g.name,
          onClick: () => onMoveFriend(friend.id, g.id),
        })),
      },
      { key: 'move-default', icon: <SwapOutlined />, label: '移动到默认分组', onClick: () => onMoveFriend(friend.id, null) },
      { type: 'divider' as const },
      { key: 'delete', icon: <DeleteOutlined />, label: '删除好友', danger: true, onClick: () => onDeleteFriend(friend.id) },
    ],
  })

  const getGroupMenu = (group: any) => {
    if (group.id === 0) return undefined
    return {
      items: [
        { key: 'rename', icon: <FolderAddOutlined />, label: '重命名', onClick: () => { setRenameGroupId(group.id); setRenameValue(group.name); setRenameModalOpen(true) } },
        { key: 'delete-group', icon: <DeleteOutlined />, label: '删除分组', danger: true, onClick: () => handleDeleteGroup(group.id) },
      ],
    }
  }

  if (groups.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 16 }}>好友列表</Text>
          <Button icon={<FolderAddOutlined />} onClick={() => setCreateModalOpen(true)}>新建分组</Button>
        </div>
        <Empty description="暂无好友，去添加好友吧" />
        <Modal title="新建分组" open={createModalOpen} onOk={handleCreateGroup} onCancel={() => setCreateModalOpen(false)}>
          <Input placeholder="分组名称" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
        </Modal>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ fontSize: 16 }}>好友列表</Text>
        <Button icon={<FolderAddOutlined />} onClick={() => setCreateModalOpen(true)}>新建分组</Button>
      </div>
      <Collapse
        defaultActiveKey={groups.map((_, i) => String(i))}
        items={groups.map((group: any, index: number) => ({
          key: String(index),
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>{group.name}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{group.friends?.length || 0} 人</Text>
            </div>
          ),
          extra: group.id !== 0 ? (
            <Dropdown menu={getGroupMenu(group)} trigger={['click']}>
              <Button type="text" size="small" icon={<EllipsisOutlined />} onClick={e => e.stopPropagation()} />
            </Dropdown>
          ) : null,
          children: (
            <List
              dataSource={group.friends || []}
              locale={{ emptyText: <Text type="secondary">暂无好友</Text> }}
              renderItem={(friend: any) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      size="small"
                      icon={<MessageOutlined />}
                      onClick={() => onStartChat(friend.friend?.id)}
                      style={{ textDecoration: 'none' }}
                    />,
                    <Dropdown menu={getFriendMenu(friend)} trigger={['click']}>
                      <Button type="text" icon={<EllipsisOutlined />} />
                    </Dropdown>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge status={friend.friend?.status === 'online' ? 'success' : 'default'} dot>
                        <Avatar src={friend.friend?.avatar} icon={<UserOutlined />} />
                      </Badge>
                    }
                    title={friend.remark || friend.friend?.nickname || friend.friend?.username}
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {friend.friend?.status === 'online' ? '在线' : '离线'}
                        {friend.friend?.signature ? ` · ${friend.friend.signature}` : ''}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          ),
        }))}
      />

      <Modal title="新建分组" open={createModalOpen} onOk={handleCreateGroup} onCancel={() => setCreateModalOpen(false)}>
        <Input placeholder="分组名称" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
      </Modal>
      <Modal title="重命名分组" open={renameModalOpen} onOk={handleRenameGroup} onCancel={() => setRenameModalOpen(false)}>
        <Input placeholder="分组名称" value={renameValue} onChange={e => setRenameValue(e.target.value)} />
      </Modal>
    </div>
  )
}
